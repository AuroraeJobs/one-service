package org.aurorae.tsdb.hbase.dao;

import org.aurorae.tsdb.hbase.util.HBaseRowPeriod;
import org.aurorae.tsdb.hbase.util.TimeUtil;
import org.aurorae.tsdb.hbase.util.UidUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.hbase.util.Bytes;

import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

/**
 * 根据周期计算
 * - time的keyLength
 * - 时间戳转byte
 * - byte转时间戳
 * - 计算col
 */
@Slf4j
public class HBaseRowHelper {

    private static final Map<Object, Integer> periodKeyMap = new HashMap<>();

    static {
        try {
            Properties prop = new Properties();
            prop.load(HBaseRowHelper.class.getResourceAsStream("period.properties"));
            prop.forEach((k, v) -> periodKeyMap.put(k, Integer.parseInt(String.valueOf(v))));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }
    }

    public static Integer getPeriod(Object object) {
        return periodKeyMap.get(object);
    }

    /**
     * 计算row中的time
     *
     * @param period 汇聚周期，以分钟为单位
     */
    public static byte[] msTimeToBytes(long timestamp, HBaseRowPeriod period, int keyWidth) {
        if (period == null) {
            period = HBaseRowPeriod.h1;
        }
        long baseTime;
        if (HBaseRowPeriod.h1.equals(period)) {
            baseTime = msToHour(timestamp); //小时的按秒表示
        } else if (period.littleThanOneHour()) {
            baseTime = TimeUtil.monthsBetween(HBaseConstants.BASE_YEAY_MS, timestamp);
        } else {
            baseTime = 0;
        }
        return UidUtil.alignBytes(baseTime, keyWidth);
    }


    public static long timeBytesToMS(byte[] timeBytes, HBaseRowPeriod period) {
        if (period == null) {
            period = HBaseRowPeriod.h1;
        }
        byte[] bytes = UidUtil.alignBytes(timeBytes);
        long baseTime = Bytes.toLong(bytes);
        if (period.equals(HBaseRowPeriod.h1)) {
            // 小时的按秒表示
            baseTime = baseTime * 1000;
        } else if (period.littleThanOneHour()) {
            // 小时以下的都按月存
            baseTime = TimeUtil.getMillisByMonthOffset(HBaseConstants.BASE_YEAY_MS, (int) baseTime);
        }
        return baseTime;
    }

    /**
     * 获取列，小时以下的周期，以月为row,col为月后的周期偏移数
     */
    public static long getCol(long timestamp, HBaseRowPeriod period) {
        if (period == null) {
            //非聚合数据
            return msToHourMS(timestamp);
        }
        if (period.littleThanOneHour()) {
            switch (period) {
                case s10:
                    //自本月以来，第个10秒
                    return TimeUtil.getMonthStartMs(timestamp, 10000);
                case s15:
                    //自本月以来，第个15秒
                    return TimeUtil.getMonthStartMs(timestamp, 15000);
                case s30:
                    //自本月以来，第个30秒
                    return TimeUtil.getMonthStartMs(timestamp, 30000);
                case m1:
                    //自本月以来，第几分钟
                    return TimeUtil.getMonthStartMs(timestamp, 60000);
                case m5:
                    //自本月以来，第个5分钟
                    return TimeUtil.getMonthStartMs(timestamp, 300000);
                case m10:
                    //自本月以来，第个10分钟
                    return TimeUtil.getMonthStartMs(timestamp, 600000);
                case m15:
                    //自本月以来，第个15分钟
                    return TimeUtil.getMonthStartMs(timestamp, 900000);
                case m20:
                    //自本月以来，第个20分钟
                    return TimeUtil.getMonthStartMs(timestamp, 1200000);
                case m30:
                    //自本月以来，第个15分钟
                    return TimeUtil.getMonthStartMs(timestamp, 1800000);
            }
        } else {
            switch (period) {
                case h1:
                    return TimeUtil.hoursBetween(HBaseConstants.BASE_YEAY_MS, timestamp);//自2000年以来，第几个小时
                case h2:
                    return TimeUtil.hoursBetween(HBaseConstants.BASE_YEAY_MS, timestamp) / 2;//自2000年以来，第几个2小时
                case h3:
                    return TimeUtil.hoursBetween(HBaseConstants.BASE_YEAY_MS, timestamp) / 3;//自2000年以来，第几个小时
                case h6:
                    return TimeUtil.hoursBetween(HBaseConstants.BASE_YEAY_MS, timestamp) / 6;//自2000年以来，第几个2小时
                case h12:
                    return TimeUtil.hoursBetween(HBaseConstants.BASE_YEAY_MS, timestamp) / 12;//自2000年以来，第几个12小时
                case d1:
                    return TimeUtil.daysBetween(HBaseConstants.BASE_YEAY_MS, timestamp);//自2000年以来，第几天
                case d2:
                    return TimeUtil.daysBetween(HBaseConstants.BASE_YEAY_MS, timestamp) / 2;//自2000年以来，第几天
                case d3:
                    return TimeUtil.daysBetween(HBaseConstants.BASE_YEAY_MS, timestamp) / 3;//自2000年以来，第几天
                case w1:
                    return TimeUtil.weeksBetween(HBaseConstants.BASE_YEAY_MS, timestamp);//自2000年以来，第几周
                case M1:
                    return TimeUtil.monthsBetween(HBaseConstants.BASE_YEAY_MS, timestamp);
                case q1:
                    return TimeUtil.quantersBetween(HBaseConstants.BASE_YEAY_MS, timestamp);
                case y1:
                    return TimeUtil.yearsBetween(HBaseConstants.BASE_YEAY_MS, timestamp);
            }
        }
        return timestamp;
    }

    public static long msToHourMS(long timestamp) {
        return timestamp - (msToHour(timestamp) * 1000);
    }

    public static long msToHour(long timestamp) {
        // 小时的按秒表示
        long s = timestamp / 1000;
        return s - (s % 3600);
    }

    /**
     * 获取聚合的时间戳
     *
     * @param period   聚合周期
     * @param baseTime 当前月的时间戳
     * @param ms       偏移数
     */
    public static long offsetPeriodToMS(HBaseRowPeriod period, long baseTime, Long ms) {
        if (period == null) {
            return baseTime + ms;
        }
        if (baseTime != 0) {
            // 周期为小时以下的月汇聚数据，ms为分钟级别
            switch (period) {
                case s10:
                    return baseTime + ms * 10000;//自本月以来，第个10秒
                case s15:
                    return baseTime + ms * 15000;//自本月以来，第个15秒
                case s30:
                    return baseTime + ms * 30000;//自本月以来，第个15秒
                case m1:
                    return baseTime + ms * 60000;//自本月以来，第几分钟
                case m5:
                    return baseTime + ms * 300000;//自本月以来，第个5分钟
                case m10:
                    return baseTime + ms * 600000;//自本月以来，第个10分钟
                case m15:
                    return baseTime + ms * 900000;//自本月以来，第个15分钟
                case m20:
                    return baseTime + ms * 1200000;//自本月以来，第个20分钟
                case m30:
                    return baseTime + ms * 1800000;//自本月以来，第个15分钟
            }
        } else {
            // 周期为小时以上的聚合数据，存在aggregate表中
            int offset = ms.intValue();
            switch (period) {
                case h1:
                    return TimeUtil.getMillisByHourOffset(HBaseConstants.BASE_YEAY_MS, offset);
                case h2:
                    return TimeUtil.getMillisByHourOffset(HBaseConstants.BASE_YEAY_MS, offset * 2);
                case h3:
                    return TimeUtil.getMillisByHourOffset(HBaseConstants.BASE_YEAY_MS, offset * 3);
                case h6:
                    return TimeUtil.getMillisByHourOffset(HBaseConstants.BASE_YEAY_MS, offset * 6);
                case h12:
                    return TimeUtil.getMillisByHourOffset(HBaseConstants.BASE_YEAY_MS, offset * 12);
                case d1:
                    return TimeUtil.getMillisByDayOffset(HBaseConstants.BASE_YEAY_MS, offset);
                case d2:
                    return TimeUtil.getMillisByDayOffset(HBaseConstants.BASE_YEAY_MS, offset * 2);
                case d3:
                    return TimeUtil.getMillisByDayOffset(HBaseConstants.BASE_YEAY_MS, offset * 3);
                case w1:
                    return TimeUtil.getMillisByWeekOffset(HBaseConstants.BASE_YEAY_MS, offset);
                case M1:
                    return TimeUtil.getMillisByMonthOffset(HBaseConstants.BASE_YEAY_MS, offset);
                case q1:
                    return TimeUtil.getMillisByMonthOffset(HBaseConstants.BASE_YEAY_MS, offset * 3);
                case M6:
                    return TimeUtil.getMillisByMonthOffset(HBaseConstants.BASE_YEAY_MS, offset * 6);
                case y1:
                    return TimeUtil.getMillisByYearOffset(HBaseConstants.BASE_YEAY_MS, offset);
            }
        }
        return 0;
    }
}
