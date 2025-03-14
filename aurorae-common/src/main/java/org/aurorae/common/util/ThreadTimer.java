package org.aurorae.common.util;

import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
public class ThreadTimer {

    private static final Map<String, AtomicLong> timer = new ConcurrentHashMap<>();

    /**
     * 刷新
     */
    public static void refresh() {
        String currentThread = Thread.currentThread().getName();
        long currentTime = System.currentTimeMillis();
        AtomicLong time = timer.get(currentThread);
        if (time != null) {
            log.debug("\n> ThreadTimer.refresh: {}\n> 耗时: {}", currentThread, DateUtils.getTimeText(currentTime - time.getAndSet(currentTime)));
        } else {
            timer.put(currentThread, new AtomicLong(currentTime));
            log.debug("\n> ThreadTimer.timer: {}\n> 计时: {}", currentThread, currentTime);
        }
    }

    /**
     * 清除
     */
    public static void remove() {
        String currentThread = Thread.currentThread().getName();
        long currentTime = System.currentTimeMillis();
        Optional.ofNullable(timer.remove(currentThread))
                .ifPresent(time -> log.debug("\n> ThreadTimer.remove: {}\n> 耗时: {}\n> 剩余线程数: {}", currentThread, DateUtils.getTimeText(currentTime - time.get()), timer.size()));
    }

    public static void timer() {
        refresh();
    }

    public static void timer(String info) {
        refresh();
        log.debug("\n> {}", info);
    }

    public static void clear() {
        remove();
    }

    /**
     * 正常清除
     *
     * @param debug 调试信息
     */
    public static void clear(String debug) {
        remove();
        log.debug("\n> {}", debug);
    }

    /**
     * 异常清除
     *
     * @param error 异常信息
     */
    public static void error(String error) {
        remove();
        log.error("\n> {}", error);
    }

    public static void info(String var1, Object... var2) {
        log.info("\n> [" + Thread.currentThread().getName() + "]: " + System.currentTimeMillis()
                + "\n> " + var1, var2);
    }

    public static void debug(String var1, Object... var2) {
        log.debug("\n> [" + Thread.currentThread().getName() + "]: " + System.currentTimeMillis()
                + "\n> " + var1, var2);
    }

    public static void error(String var1, Object... var2) {
        log.error("\n> [" + Thread.currentThread().getName() + "]: " + System.currentTimeMillis()
                + "\n> " + var1, var2);
    }
}
