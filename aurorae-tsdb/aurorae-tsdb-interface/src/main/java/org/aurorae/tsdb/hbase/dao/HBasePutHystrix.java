package org.aurorae.tsdb.hbase.dao;

import com.netflix.hystrix.*;
import org.aurorae.tsdb.hbase.util.HBaseClient;
import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.hbase.client.Put;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
public class HBasePutHystrix extends HystrixCommand<Integer> {

    private final String dataTableName;
    private final List<Put> putList;
    
    private final BlockingQueue<Put> queue;
	private final BlockingQueue<Runnable> putDataRunnableQueue;
    
	private final AtomicInteger count;
	private final AtomicLong wTime;
	
	private static int requestVolumeThreshold = 20;//至少有20个请求，熔断器才进行错误率的计算
    private static int sleepWindowInMilliseconds = 5 * 1000;//熔断器中断请求5秒后会进入半打开状态,放部分流量过去重试
    private static int errorThresholdPercentage = 50;//错误率达到50开启熔断保护
    private static int timeoutInMilliseconds = 1000;//响应大于1000毫秒算超时
    private static int rollingStatisticalWindowInMilliseconds = 10 * 1000;//滑动窗口的持续时间
    private static int rollingStatisticalWindowBuckets = 10;//滑动步长
    
    private static int coreSize = 10;
    private static int maximumSize = 10;
    private static int maxQueueSize = 5000;
    private static int queueSizeRejectionThreshold = 5000;
    
    static {
    	String requestVolumeThresholdStr = System.getProperty("wave.circuitBreaker.requestVolumeThreshold");
    	if (requestVolumeThresholdStr != null && !"".equals(requestVolumeThresholdStr.trim()) 
    			&& requestVolumeThresholdStr.trim().matches("\\d+")) {
    		requestVolumeThreshold = Integer.parseInt(requestVolumeThresholdStr.trim());
    	}
    	
    	String sleepWindowInMillisecondsStr = System.getProperty("wave.circuitBreaker.sleepWindowInMilliseconds");
    	if (sleepWindowInMillisecondsStr != null && !"".equals(sleepWindowInMillisecondsStr.trim()) 
    			&& sleepWindowInMillisecondsStr.trim().matches("\\d+")) {
    		sleepWindowInMilliseconds = Integer.parseInt(sleepWindowInMillisecondsStr.trim());
    	}
    	
    	String errorThresholdPercentageStr = System.getProperty("wave.circuitBreaker.errorThresholdPercentage");
    	if (errorThresholdPercentageStr != null && !"".equals(errorThresholdPercentageStr.trim()) 
    			&& errorThresholdPercentageStr.trim().matches("\\d+")) {
    		errorThresholdPercentage = Integer.parseInt(errorThresholdPercentageStr.trim());
    	}
    	
    	String timeoutInMillisecondsStr = System.getProperty("wave.execution.timeoutInMilliseconds");
    	if (timeoutInMillisecondsStr != null && !"".equals(timeoutInMillisecondsStr.trim()) 
    			&& timeoutInMillisecondsStr.trim().matches("\\d+")) {
    		timeoutInMilliseconds = Integer.parseInt(timeoutInMillisecondsStr.trim());
    	}
    	
    	String rollingStatisticalWindowInMillisecondsStr = System.getProperty("wave.metrics.rollingStatisticalWindowInMilliseconds");
    	if (rollingStatisticalWindowInMillisecondsStr != null && !"".equals(rollingStatisticalWindowInMillisecondsStr.trim()) 
    			&& rollingStatisticalWindowInMillisecondsStr.trim().matches("\\d+")) {
    		rollingStatisticalWindowInMilliseconds = Integer.parseInt(rollingStatisticalWindowInMillisecondsStr.trim());
    	}
    	
    	String rollingStatisticalWindowBucketsStr = System.getProperty("wave.metrics.rollingStatisticalWindowBuckets");
    	if (rollingStatisticalWindowBucketsStr != null && !"".equals(rollingStatisticalWindowBucketsStr.trim()) 
    			&& rollingStatisticalWindowBucketsStr.trim().matches("\\d+")) {
    		rollingStatisticalWindowBuckets = Integer.parseInt(rollingStatisticalWindowBucketsStr.trim());
    	}
    	
    	String coreSizeStr = System.getProperty("wave.hystrixThreadPool.coreSize");
    	if (coreSizeStr != null && !"".equals(coreSizeStr.trim()) 
    			&& coreSizeStr.trim().matches("\\d+")) {
    		coreSize = Integer.parseInt(coreSizeStr.trim());
    	}
    	
    	String maximumSizeStr = System.getProperty("wave.hystrixThreadPool.maximumSize");
    	if (maximumSizeStr != null && !"".equals(maximumSizeStr.trim()) 
    			&& maximumSizeStr.trim().matches("\\d+")) {
    		maximumSize = Integer.parseInt(maximumSizeStr.trim());
    	}
    	
    	String maxQueueSizeStr = System.getProperty("wave.hystrixThreadPool.maxQueueSize");
    	if (maxQueueSizeStr != null && !"".equals(maxQueueSizeStr.trim()) 
    			&& maxQueueSizeStr.trim().matches("\\d+")) {
    		maxQueueSize = Integer.parseInt(maxQueueSizeStr.trim());
    	}
    	
    	String queueSizeRejectionThresholdStr = System.getProperty("wave.hystrixThreadPool.queueSizeRejectionThreshold");
    	if (queueSizeRejectionThresholdStr != null && !"".equals(queueSizeRejectionThresholdStr.trim()) 
    			&& queueSizeRejectionThresholdStr.trim().matches("\\d+")) {
    		queueSizeRejectionThreshold = Integer.parseInt(queueSizeRejectionThresholdStr.trim());
    	}
    }
    
    private static final HystrixCommandProperties.Setter hystrixCommandPropertiesSetter = HystrixCommandProperties.Setter()
        .withCircuitBreakerRequestVolumeThreshold(requestVolumeThreshold)
        .withCircuitBreakerSleepWindowInMilliseconds(sleepWindowInMilliseconds)
        .withCircuitBreakerErrorThresholdPercentage(errorThresholdPercentage)
        .withExecutionTimeoutInMilliseconds(timeoutInMilliseconds)
        .withMetricsRollingStatisticalWindowInMilliseconds(rollingStatisticalWindowInMilliseconds)
        .withMetricsRollingStatisticalWindowBuckets(rollingStatisticalWindowBuckets);
        //.withFallbackIsolationSemaphoreMaxConcurrentRequests(100);
	
    private static final HystrixThreadPoolProperties.Setter hystrixThreadPoolPropertiesSetter = HystrixThreadPoolProperties.Setter()
		.withCoreSize(coreSize)
		.withMaximumSize(maximumSize)
		.withMaxQueueSize(maxQueueSize)
		.withQueueSizeRejectionThreshold(queueSizeRejectionThreshold);
    
    public long getCircuitBreakerSleepWindowInMilliseconds(){
    	return hystrixCommandPropertiesSetter.getCircuitBreakerSleepWindowInMilliseconds();
    }
	
	public HBasePutHystrix(String dataTableName,
						   List<Put> putList,
						   BlockingQueue<Runnable> putDataRunnableQueue,
						   BlockingQueue<Put> queue,
						   AtomicInteger count,
						   AtomicLong wTime) {
        super(Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("waveKpiToTsdb"))
                .andCommandKey(HystrixCommandKey.Factory.asKey("batchPut"))
                .andCommandPropertiesDefaults(hystrixCommandPropertiesSetter)
                .andThreadPoolPropertiesDefaults(hystrixThreadPoolPropertiesSetter));
        this.dataTableName = dataTableName;
        this.putList = putList;
        
        this.putDataRunnableQueue = putDataRunnableQueue;
        this.queue = queue;
        
        this.count = count;
        this.wTime = wTime;
    }
 
    @Override
    protected Integer run() {
    	long bstime=System.currentTimeMillis();
		try {
			HBaseClient.put(dataTableName,putList);
		} catch (IOException e) {
			log.error(e.getMessage(), e);
		}
		long betime=System.currentTimeMillis();
		count.addAndGet(putList.size());
		
		if (log.isTraceEnabled()) {
			log.trace("tsdb taskPoolSize="+putDataRunnableQueue.size()
			+",batchQueueSize="+queue.size()+",csize="+count.get()+",ctime="+wTime.get()+",cbsize="+putList.size()+",cbtime="+(betime-bstime));
		}
		
		wTime.addAndGet(betime-bstime);
		if(count.get()>10000){
			log.info("tsdb taskPoolSize="+putDataRunnableQueue.size()
					+",batchQueueSize="+queue.size()+",csize="+count.get()+",ctime="+wTime.get()+",cbsize="+putList.size()+",cbtime="+(betime-bstime));
			wTime.set(0);
			count.set(0);
		}
        
        return 1;
    }
 
    @Override
    protected Integer getFallback() {
        return -1;
    }
}

