package org.aurorae.tsdb.hbase.dao;

public class HBaseConstants {

    /**
     * 聚合周期的粒度，以分钟为单位
     */
    public static final int TIME_TYPE_1_MINUTE = 1;
    public static final int TIME_TYPE_2_MINUTE = 2;
    public static final int TIME_TYPE_15_MINUTE = 15;
    public static final int TIME_TYPE_30_MINUTE = 30;
    public static final int TIME_TYPE_1_HOUR = 60;
    public static final int TIME_TYPE_2_HOUR = 60 * 2;
    public static final int TIME_TYPE_12_HOUR = 60 * 12;
    public static final int TIME_TYPE_1_DAY = 60 * 24;
    public static final int TIME_TYPE_2_DAY = 60 * 24 * 2;
    public static final int TIME_TYPE_1_WEEK = 60 * 24 * 7;
    public static final int TIME_TYPE_1_MONTH = 60 * 24 * 30;
    public static final int TIME_TYPE_1_QUARTER = 60 * 24 * 30 * 3;
    public static final int TIME_TYPE_2_QUARTER = 60 * 24 * 30 * 6;
    public static final int TIME_TYPE_1_YEAR = 60 * 24 * 30 * 12;
    public static final long BASE_YEAY = 2000;//基准年份
    public static final long BASE_YEAY_SEC = 946656000;//2000-01-01 00:00:00 的时间戳，单位秒
    public static final long BASE_YEAY_MS = 946656000000L;//2000-01-01 00:00:00 的时间戳，单位秒
    public static final int BASE_YEAR = 2000;//2000-01-01 00:00:00 的时间戳，单位秒
}
