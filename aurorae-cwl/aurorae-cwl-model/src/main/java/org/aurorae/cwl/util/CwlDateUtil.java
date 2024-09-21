package org.aurorae.cwl.util;

import org.aurorae.cwl.enums.CwlWeek;

import java.text.SimpleDateFormat;
import java.util.Calendar;

public class CwlDateUtil {

    public static void nextIssue(Calendar calendar) {
        // 如果是周四+3天，如果是周二或者周日+2天
        calendar.add(Calendar.DAY_OF_MONTH, calendar.get(Calendar.DAY_OF_WEEK) == Calendar.THURSDAY ? 3 : 2);
    }

    public static int nextIssueDay(String week) {
        // 如果是周四，距离下一期周日是隔三天
        // 不然则是周二或周六，距离下一期是隔两天
        return CwlWeek.THU.getName().equals(week) ? 3 : 2;
    }

    public static Calendar getFirstIssueDateOfYear(int year) {
        // 从当年1月1号开始，查找第一个周日或周二或周四的日期
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.YEAR, year);
        cal.set(Calendar.MONTH, Calendar.JANUARY);
        cal.set(Calendar.DAY_OF_MONTH, 1);
        int week = cal.get(Calendar.DAY_OF_WEEK);
        while (week != Calendar.SUNDAY && week != Calendar.TUESDAY && week != Calendar.THURSDAY) {
            cal.add(Calendar.DAY_OF_MONTH, 1);
            week = cal.get(Calendar.DAY_OF_WEEK);
        }
        return cal;
    }

    public static String firstIssueDateOfYear(int year) {
        Calendar cal = getFirstIssueDateOfYear(year);
        return String.format("%s(%s)",
                new SimpleDateFormat("yyyy-MM-dd").format(cal.getTime()),
                CwlWeek.getNameByValue(cal.get(Calendar.DAY_OF_WEEK) - 1));
    }

    public static int sumIssueOfYear(int year) {
        int sum = 1;
        Calendar cal = getFirstIssueDateOfYear(year);
        while (cal.get(Calendar.YEAR) == year) {
            nextIssue(cal);
            sum++;
        }
        return sum;
    }
}
