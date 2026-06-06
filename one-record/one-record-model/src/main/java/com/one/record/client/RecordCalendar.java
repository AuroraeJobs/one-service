package com.one.record.client;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import com.one.common.util.StreamUtil;
import com.one.record.enums.RecordWeek;
import com.one.record.response.Record;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

@Slf4j
@Getter
@Setter
public class RecordCalendar {

    private static final SimpleDateFormat FORMAT = new SimpleDateFormat("yyyy-MM-dd");

    public static List<Record> fetch(String now) {
        // 看日历是否有最新数据
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);

        // 获取当前时间作为查询条件的结束时间
        Date endTime = calendar.getTime();
        String end = FORMAT.format(endTime);

        try {
            // 获取当前一期的下一期作为查询条件的开始时间
            calendar.setTime(FORMAT.parse(now));
            nextIssue(calendar);
        } catch (ParseException e) {
            throw new RuntimeException(e);
        }
        Date startTime = calendar.getTime();
        String start = FORMAT.format(startTime);

        log.info("> ✅当前日期: {}", now);

        // 只有当结束时间已经过了开始时间才请求更新
        if (endTime.after(startTime)) {
            log.info("> ✅开始日期: {}", start);
            log.info("> ✅结束日期: {}", end);
            List<Record> records = RecordClient.record(start, end);
            log.info("> ✅更新数据: {}", StreamUtil.toList(records, Record::record));
            return records;
        }
        return null;
    }

    public static void nextIssue(Calendar calendar) {
        // 如果是周四+3天，如果是周二或者周日+2天
        calendar.add(Calendar.DAY_OF_MONTH, calendar.get(Calendar.DAY_OF_WEEK) == Calendar.THURSDAY ? 3 : 2);
    }

    public static int nextIssueDay(String week) {
        return RecordWeek.THU.getName().equals(week) ? 3 : 2;
    }

    public static Calendar getFirstIssueDateOfYear(int year) {
        // 从当年1月1号开始，查找第一个周日或周二或周四的日期
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.YEAR, year);
        calendar.set(Calendar.MONTH, Calendar.JANUARY);
        calendar.set(Calendar.DAY_OF_MONTH, 1);
        int week = calendar.get(Calendar.DAY_OF_WEEK);
        while (week != Calendar.SUNDAY && week != Calendar.TUESDAY && week != Calendar.THURSDAY) {
            calendar.add(Calendar.DAY_OF_MONTH, 1);
            week = calendar.get(Calendar.DAY_OF_WEEK);
        }
        return calendar;
    }

    public static String firstIssueDateOfYear(int year) {
        Calendar calendar = getFirstIssueDateOfYear(year);
        return String.format("%s(%s)",
                new SimpleDateFormat("yyyy-MM-dd").format(calendar.getTime()),
                RecordWeek.getNameByValue(calendar.get(Calendar.DAY_OF_WEEK) - 1));
    }

    public static int sumIssueOfYear(int year) {
        int sum = 1;
        Calendar calendar = getFirstIssueDateOfYear(year);
        while (calendar.get(Calendar.YEAR) == year) {
            nextIssue(calendar);
            sum++;
        }
        return sum;
    }
}
