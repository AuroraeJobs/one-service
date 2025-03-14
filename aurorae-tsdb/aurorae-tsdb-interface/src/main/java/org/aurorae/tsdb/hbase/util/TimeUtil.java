package org.aurorae.tsdb.hbase.util;

import org.joda.time.Chronology;
import org.joda.time.DateTime;
import org.joda.time.DateTimeUtils;
import org.joda.time.DurationFieldType;

import java.util.Date;

public class TimeUtil {

    public static long minutesBetween(long startMs, long endMs) {
        return timeBetweenByType(startMs, endMs, DurationFieldType.minutes());
    }

    public static long hoursBetween(long startMs, long endMs) {
        return timeBetweenByType(startMs, endMs, DurationFieldType.hours());
    }

    public static long daysBetween(long startMs, long endMs) {
        return timeBetweenByType(startMs, endMs, DurationFieldType.days());
    }

    public static long weeksBetween(long startMs, long endMs) {
        return timeBetweenByType(startMs, endMs, DurationFieldType.months());
    }

    public static long monthsBetween(long startMs, long endMs) {
        return timeBetweenByType(startMs, endMs, DurationFieldType.months());
    }

    public static long quantersBetween(long startMs, long endMs) {
        return monthsBetween(startMs, endMs) / 3;
    }

    public static long yearsBetween(long startMs, long endMs) {
        return timeBetweenByType(startMs, endMs, DurationFieldType.years());
    }

    private static long timeBetweenByType(long startMs, long endMs, DurationFieldType type) {
        Chronology chrono = DateTimeUtils.getInstantChronology(new DateTime(startMs));
        return type.getField(chrono).getDifference(endMs, startMs);
    }

    public static long getMillisByDayOffset(long startMs, int days) {
        DateTime date = new DateTime(startMs);
        date = date.plusDays(days);
        return date.getMillis();
    }

    public static long getMillisByHourOffset(long startMs, int hours) {
        DateTime date = new DateTime(startMs);
        date = date.plusHours(hours);
        return date.getMillis();
    }

    public static long getMillisByWeekOffset(long startMs, int weeks) {
        DateTime date = new DateTime(startMs);
        date = date.plusWeeks(weeks);
        return date.getMillis();
    }

    public static long getMillisByMonthOffset(long startMs, int months) {
        DateTime date = new DateTime(startMs);
        date = date.plusMonths(months);
        return date.getMillis();
    }

    public static long getMillisByYearOffset(long startMs, int years) {
        DateTime date = new DateTime(startMs);
        date = date.plusYears(years);
        return date.getMillis();
    }

    /**
     * 获取时间戳当前月的第一天的毫秒数
     */
    public static long getMonthStartMs(long timestamp, int x) {
        long y = getMonthStartMs(timestamp);
        return (timestamp - y) / x;
    }

    public static long getMonthStartMs(long timestamp) {
        Date date = new Date(timestamp);
        Date _date = new Date(date.getYear(), date.getMonth(), 1);
        return _date.getTime();
    }
}
