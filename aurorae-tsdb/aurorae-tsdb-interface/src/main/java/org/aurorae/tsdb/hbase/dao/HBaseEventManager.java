package org.aurorae.tsdb.hbase.dao;

import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.hbase.client.Put;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
public class HBaseEventManager {

    protected final LinkedBlockingQueue<Put> queue = new LinkedBlockingQueue<>(100000);

    private final BlockingQueue<Runnable> putDataRunnableQueue;

    private final ExecutorService executor;

    private final String tableName;
    private final AtomicInteger count = new AtomicInteger();
    private final AtomicLong wTime = new AtomicLong();

    private int batchSize = 20;


    public HBaseEventManager(String tableName) {
        log.debug("> HBaseTable [{}] EventExecutor init start...", tableName);
        this.tableName = tableName;
        this.putDataRunnableQueue = new ThreadPoolExecutor(5, 5, 60L, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(100000),
                new ThreadPoolExecutor.CallerRunsPolicy()
        ).getQueue();
        String batchSizeStr = System.getProperty("wave.batchSize");
        if (batchSizeStr != null && !batchSizeStr.trim().isEmpty() && batchSizeStr.trim().matches("\\d+")) {
            batchSize = Integer.parseInt(batchSizeStr.trim());
        }

        executor = new ThreadPoolExecutor(10, 10, 60L, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(5000),
                Executors.defaultThreadFactory(),
                new ThreadPoolExecutor.CallerRunsPolicy());

        //批处理最长时间间隔毫秒
        long batchWindow = 1000;
        Executors.newSingleThreadScheduledExecutor().scheduleAtFixedRate(() -> {
            List<Put> putList = new ArrayList<>(batchSize);
            queue.drainTo(putList, batchSize);
            if (!putList.isEmpty()) {
                if (log.isTraceEnabled()) {
                    log.trace("waveScheduledExecutorService is running putList size: " + putList.size());
                }
                saveWaveKpiToTsdb(putList);
            }
        }, batchWindow, batchWindow, TimeUnit.MILLISECONDS);
        log.debug("> HBaseTable [{}] EventExecutor init finish.", tableName);
    }

    public void doEvent(Put data) {
        // 在拒绝请求期间休眠
        HBasePutHystrix putWaveKpiCommandTest = new HBasePutHystrix(tableName, new ArrayList<>(), putDataRunnableQueue, queue, count, wTime);
        if (putWaveKpiCommandTest.isCircuitBreakerOpen()) {
            try {
                TimeUnit.MILLISECONDS.sleep(putWaveKpiCommandTest.getCircuitBreakerSleepWindowInMilliseconds());
            } catch (InterruptedException e) {
                log.error(e.getMessage(), e);
            }

            if (log.isDebugEnabled()) {
                log.debug("hbase hystrix circuit breaker is open sleeped: " + putWaveKpiCommandTest.getCircuitBreakerSleepWindowInMilliseconds() + "(ms)");
            }
        }

        try {
            queue.put(data);
            synchronized (queue) {
                // 每20个波形Kpi保存一次；如果一秒之后都不满20个波形kpi，则由waveScheduledExecutorService处理
                if (queue.size() > batchSize) {
                    List<Put> putList = new ArrayList<>(batchSize);
                    queue.drainTo(putList, batchSize);
                    executor.execute(new SaveOpentsdbRunner(putList));
                }
            }
        } catch (Exception e) {
            log.warn(e.getMessage(), e);
        }
    }

    class SaveOpentsdbRunner implements Runnable {
        private final List<Put> putList;

        public SaveOpentsdbRunner(List<Put> putList) {
            super();
            this.putList = putList;
        }

        @Override
        public void run() {
            saveWaveKpiToTsdb(putList);
        }
    }

    private void saveWaveKpiToTsdb(List<Put> putList) {
        try {
            // 在拒绝请求期间休眠
            HBasePutHystrix putWaveKpiCommandTest = new HBasePutHystrix(tableName, new ArrayList<>(), putDataRunnableQueue, queue, count, wTime);
            if (putWaveKpiCommandTest.isCircuitBreakerOpen()) {
                TimeUnit.MILLISECONDS.sleep(putWaveKpiCommandTest.getCircuitBreakerSleepWindowInMilliseconds());
                if (log.isDebugEnabled()) {
                    log.debug("hbase hystrix circuit breaker is open sleeped: " + putWaveKpiCommandTest.getCircuitBreakerSleepWindowInMilliseconds() + "(ms)");
                }
            }

            // 封安了Hystrix，使用它的限流和熔断
            HBasePutHystrix putWaveKpiCommand = new HBasePutHystrix(tableName, putList, putDataRunnableQueue, queue, count, wTime);
            putWaveKpiCommand.execute();

            Throwable throwable = putWaveKpiCommand.getExecutionException();
            if (throwable instanceof RuntimeException) {
                // 让hystrix请求异常(HystrixBadRequestException)、拒绝(RejectedExecutionException)和短路(RuntimeException)的kpiValueList重新执行
                executor.execute(new SaveOpentsdbRunner(putList));
            }
        } catch (Exception e) {
            log.warn("save to hbase error.", e);
        }
    }
}
