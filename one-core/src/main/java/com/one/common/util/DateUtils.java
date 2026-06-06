package com.one.common.util;

import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Slf4j
public class DateUtils {

    public static final String GRANULARITY_UNIT_MS = "MS";//毫秒
    public static final String GRANULARITY_UNIT_SECOND = "SECOND";//秒
    public static final String GRANULARITY_UNIT_MINUTE = "MINUTE";//分钟
    public static final String GRANULARITY_UNIT_HOUR = "HOUR";//小时
    public static final String GRANULARITY_UNIT_DAY = "DAY";//天
    public static final String GRANULARITY_UNIT_WEEK = "WEEK";//周
    public static final String GRANULARITY_UNIT_MONTH = "MONTH";//月
    public static final String GRANULARITY_UNIT_QUARTER = "QUARTER";//季度
    public static final String GRANULARITY_UNIT_YEAR = "YEAR";//年
    public final static String yyyy_MM_dd_HH_mm_ss_SSS = "yyyy-MM-dd HH:mm:ss.SSS";
    public final static String yyyy_MM_dd_HH_mm_ss = "yyyy-MM-dd HH:mm:ss";
    public final static String yyyy_MM_dd = "yyyy-MM-dd";
    public final static String yyyyMMdd = "yyyyMMdd";
    public final static String HHmm = "HH:mm";

    final static long[] lunarInfo = new long[]{0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, 0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7,
            0x0c950, 0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6, 0x095b0, 0x049b0,
            0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, 0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, 0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60,
            0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0};

    final public static int lYearDays(int y)// ====== 传回农历 y年的总天数
    {
        int i, sum = 348;
        for (i = 0x8000; i > 0x8; i >>= 1) {
            if ((lunarInfo[y - 1900] & i) != 0)
                sum += 1;
        }
        return (sum + leapDays(y));
    }

    final public static int leapDays(int y)// ====== 传回农历 y年闰月的天数
    {
        if (leapMonth(y) != 0) {
            if ((lunarInfo[y - 1900] & 0x10000) != 0)
                return 30;
            else
                return 29;
        } else
            return 0;
    }

    final public static int leapMonth(int y)// ====== 传回农历 y年闰哪个月 1-12 , 没闰传回 0
    {
        return (int) (lunarInfo[y - 1900] & 0xf);
    }

    final public static int monthDays(int y, int m)// ====== 传回农历 y年m月的总天数
    {
        if ((lunarInfo[y - 1900] & (0x10000 >> m)) == 0)
            return 29;
        else
            return 30;
    }

    @SuppressWarnings("deprecation")
    final public long[] Lunar(int y, int m)// 传出农历.year0 .month1 .day2 .yearCyl3
    // .monCyl4
    // .dayCyl5 .isLeap6
    {
        final int[] year20 = new int[]{1, 4, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1};
        final int[] year19 = new int[]{0, 3, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0};
        final int[] year2000 = new int[]{0, 3, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1};
        long[] nongDate = new long[7];
        int i = 0, temp = 0, leap = 0;
        Date baseDate = new Date(1900, 1, 31);
        Date objDate = new Date(y, m, 1);
        long offset = (objDate.getTime() - baseDate.getTime()) / 86400000L;
        if (y < 2000)
            offset += year19[m - 1];
        if (y > 2000)
            offset += year20[m - 1];
        if (y == 2000)
            offset += year2000[m - 1];
        nongDate[5] = offset + 40;
        nongDate[4] = 14;

        for (i = 1900; i < 2050 && offset > 0; i++) {
            temp = lYearDays(i);
            offset -= temp;
            nongDate[4] += 12;
        }
        if (offset < 0) {
            offset += temp;
            i--;
            nongDate[4] -= 12;
        }
        nongDate[0] = i;
        nongDate[3] = i - 1864;
        leap = leapMonth(i); // 闰哪个月
        nongDate[6] = 0;

        for (i = 1; i < 13 && offset > 0; i++) {
            // 闰月
            if (leap > 0 && i == (leap + 1) && nongDate[6] == 0) {
                --i;
                nongDate[6] = 1;
                temp = leapDays((int) nongDate[0]);
            } else {
                temp = monthDays((int) nongDate[0], i);
            }

            // 解除闰月
            if (nongDate[6] == 1 && i == (leap + 1))
                nongDate[6] = 0;
            offset -= temp;
            if (nongDate[6] == 0)
                nongDate[4]++;
        }

        if (offset == 0 && leap > 0 && i == leap + 1) {
            if (nongDate[6] == 1) {
                nongDate[6] = 0;
            } else {
                nongDate[6] = 1;
                --i;
                --nongDate[4];
            }
        }
        if (offset < 0) {
            offset += temp;
            --i;
            --nongDate[4];
        }
        nongDate[1] = i;
        nongDate[2] = offset + 1;
        return nongDate;
    }

    @SuppressWarnings("deprecation")
    final public static long[] calElement(int y, int m, int d)
    // 传出y年m月d日对应的农历.year0 .month1 .day2 .yearCyl3 .monCyl4 .dayCyl5 .isLeap6
    {
        long[] nongDate = new long[7];
        int i = 0, temp = 0, leap = 0;
        Date baseDate = new Date(0, 0, 31);
        Date objDate = new Date(y - 1900, m - 1, d);
        long offset = (objDate.getTime() - baseDate.getTime()) / 86400000L;
        nongDate[5] = offset + 40;
        nongDate[4] = 14;

        for (i = 1900; i < 2050 && offset > 0; i++) {
            temp = lYearDays(i);
            offset -= temp;
            nongDate[4] += 12;
        }
        if (offset < 0) {
            offset += temp;
            i--;
            nongDate[4] -= 12;
        }
        nongDate[0] = i;
        nongDate[3] = i - 1864;
        leap = leapMonth(i); // 闰哪个月
        nongDate[6] = 0;

        for (i = 1; i < 13 && offset > 0; i++) {
            // 闰月
            if (leap > 0 && i == (leap + 1) && nongDate[6] == 0) {
                --i;
                nongDate[6] = 1;
                temp = leapDays((int) nongDate[0]);
            } else {
                temp = monthDays((int) nongDate[0], i);
            }

            // 解除闰月
            if (nongDate[6] == 1 && i == (leap + 1))
                nongDate[6] = 0;
            offset -= temp;
            if (nongDate[6] == 0)
                nongDate[4]++;
        }

        if (offset == 0 && leap > 0 && i == leap + 1) {
            if (nongDate[6] == 1) {
                nongDate[6] = 0;
            } else {
                nongDate[6] = 1;
                --i;
                --nongDate[4];
            }
        }
        if (offset < 0) {
            offset += temp;
            --i;
            --nongDate[4];
        }
        nongDate[1] = i;
        nongDate[2] = offset + 1;
        return nongDate;
    }

    public static String getchina(int day) {
        String a = "";
        if (day == 10)
            return "初十";
        int two = (int) ((day) / 10);
        if (two == 0)
            a = "初";
        if (two == 1)
            a = "十";
        if (two == 2)
            a = "廿";
        if (two == 2)
            a = "卅";
        int one = (int) (day % 10);
        switch (one) {
            case 1:
                a += "一";
                break;
            case 2:
                a += "二";
                break;
            case 3:
                a += "三";
                break;
            case 4:
                a += "四";
                break;
            case 5:
                a += "五";
                break;
            case 6:
                a += "六";
                break;
            case 7:
                a += "七";
                break;
            case 8:
                a += "八";
                break;
            case 9:
                a += "九";
                break;
        }
        return a;
    }

    public static String getchinaNum(int day) {
        String a = "";
        if (day == 10)
            return "初十";
        int two = (int) ((day) / 10);
        if (two == 0)
            a = "初";
        if (two == 1)
            a = "十";
        if (two == 2)
            a = "廿";
        if (two == 2)
            a = "卅";
        int one = (int) (day % 10);
        switch (one) {
            case 1:
                a += "一";
                break;
            case 2:
                a += "二";
                break;
            case 3:
                a += "三";
                break;
            case 4:
                a += "四";
                break;
            case 5:
                a += "五";
                break;
            case 6:
                a += "六";
                break;
            case 7:
                a += "七";
                break;
            case 8:
                a += "八";
                break;
            case 9:
                a += "九";
                break;
        }
        return a;
    }

    /**
     * 根据公历日期计算农历日历<br>
     *
     * @return 10
     */
    public static String getLunar(Date date) {
        Calendar cld = Calendar.getInstance();
        cld.setTime(date);
        int year = cld.get(Calendar.YEAR);
        int month = cld.get(Calendar.MONTH) + 1;
        int day = cld.get(Calendar.DAY_OF_MONTH);
        long[] lunar = calElement(year, month, day);
        // return getchina((int) (lunar[2]));
        return String.valueOf(lunar[2]);
    }

    public static Date trunc(Date date) {
        return mergerDateAndTime(date, "00:00");
    }

    /**
     * 合并日期和时间
     *
     * @param date
     * @param time
     * @return
     */
    public static Date mergerDateAndTime(Date date, String time) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        int HH = new Integer(time.substring(0, 2));
        int mm = new Integer(time.substring(3, 5));
        int ss = 0;
        if (time.length() == 8) {
            ss = new Integer(time.substring(6, 8));
        }
        calendar.set(calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH), HH, mm, ss);
        calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTime();

    }

    public static Long minuteDiff(Date startdate, Date endDate) {
        long between = (endDate.getTime() - startdate.getTime()) / 1000 / 60;//除以1000是为了转换成秒
        return between;
    }

    /**
     * 得到两个日期之间相差多少天
     *
     * @param beginDate 开始日期
     * @param endDate   结束日期
     * @return
     */
    public static int dateDiff(String beginDate, String endDate) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        Date date = null;
        try {
            date = sdf.parse(endDate);
        } catch (ParseException e) {
            date = new Date();
            e.printStackTrace();
        }


        long end = date.getTime();
        try {
            date = sdf.parse(beginDate);
        } catch (ParseException e) {
            date = new Date();
            e.printStackTrace();
        }
        long begin = date.getTime();

        long day = (end - begin) / (1000 * 3600 * 24);      //除1000是把毫秒变成秒

        return Integer.parseInt(Long.toString(day));
    }

    /**
     * 日期转换成年月日格式
     *
     * @param date
     * @return str
     */
    public static String DateToymd(Date date) {
        SimpleDateFormat year = new SimpleDateFormat("yyyy");
        SimpleDateFormat month = new SimpleDateFormat("MM");
        SimpleDateFormat day = new SimpleDateFormat("dd");
        String str = year.format(date) + "年" + month.format(date) + "月" + day.format(date) + "日";
        return str;
    }

    /**
     * Date类型转化为LocalDateTime,时区为0:全球通用时间
     *
     * @param date
     * @return
     */
    public static LocalDateTime dateConvertToLocalDateTime(Date date) {
        return date.toInstant().atOffset(ZoneOffset.of("+0")).toLocalDateTime();
    }

    /**
     * LocalDateTime转化为timestamp毫秒数,全球通用时间.
     *
     * @param localDateTime
     * @return
     */
    public static long getTimestampOfLocalDateTime(LocalDateTime localDateTime) {
        ZoneId zone = ZoneId.of("UTC");
        Instant instant = localDateTime.atZone(zone).toInstant();
        return instant.toEpochMilli();

    }

    public static Date getMintDay(Date date) {

        LocalDateTime localDateTime = LocalDateTime.ofInstant(Instant.ofEpochMilli(date.getTime()), ZoneId.systemDefault());

        // 通过LocalDateTime的 with方法设置某天的最小值和最大值！！
        LocalDateTime minDateTime = localDateTime.with(LocalTime.MIN);
        // 格式化日期
        Date fromDate = Date.from(minDateTime.atZone(ZoneId.systemDefault()).toInstant());
        return fromDate;
    }

    public static Date getMaxDay(Date date) {
        LocalDateTime localDateTime = LocalDateTime.ofInstant(Instant.ofEpochMilli(date.getTime()), ZoneId.systemDefault());
        LocalDateTime maxDateTime = localDateTime.with(LocalTime.MAX);
        return Date.from(maxDateTime.atZone(ZoneId.systemDefault()).toInstant());
    }

    public static Date getAfterDatePlus(Date date, int days) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        calendar.set(Calendar.DAY_OF_YEAR, calendar.get(Calendar.DAY_OF_YEAR)
                + days);
        return calendar.getTime();
    }

    /**
     * 获取指定日期所在月份开始的时间
     * lkeji
     *
     * @return
     */
    public static Date getMonthBegin(Date date) {

        Calendar c = Calendar.getInstance();
        c.setTime(date);
        //设置为1号,当前日期既为本月第一天
        c.set(Calendar.DAY_OF_MONTH, 1);
        //将小时至0
        c.set(Calendar.HOUR_OF_DAY, 0);
        //将分钟至0
        c.set(Calendar.MINUTE, 0);
        //将秒至0
        c.set(Calendar.SECOND, 0);
        //将毫秒至0
        c.set(Calendar.MILLISECOND, 0);
        // 本月第一天的时间戳转换为字符串
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        try {
            Date dat = sdf.parse(sdf.format(new Date(new Long(c.getTimeInMillis()))));
            return dat;
        } catch (NumberFormatException e) {
            // TODO 自动生成的 catch 块
            e.printStackTrace();
        } catch (ParseException e) {
            // TODO 自动生成的 catch 块
            e.printStackTrace();
        }
        return null;
    }

    /**
     * 设置当天的开始时间
     *
     * @param calendar
     */
    private static void setMinTimeOfDay(Calendar calendar) {
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.MILLISECOND, 0);
    }

    /**
     * 设置当天的结束时间
     *
     * @param calendar
     */
    private static void setMaxTimeOfDay(Calendar calendar) {
        calendar.set(Calendar.HOUR_OF_DAY, 23);
        calendar.set(Calendar.SECOND, 59);
        calendar.set(Calendar.MINUTE, 59);
        calendar.set(Calendar.MILLISECOND, 999);
    }

    /**
     * 获取指定天的开始时间
     *
     * @return
     */
    public static Date getStartTimeOfCurrentDay(Date date) {
        Calendar calendar = Calendar.getInstance();
        calendar.clear();
        calendar.setTime(date);
        setMinTimeOfDay(calendar);
        return calendar.getTime();
    }

    /**
     * 获取指定天的结束时间
     *
     * @return
     */
    public static Date getEndTimeOfCurrentDay(Date date) {
        Calendar calendar = Calendar.getInstance();
        calendar.clear();
        calendar.setTime(date);
        setMaxTimeOfDay(calendar);
        return calendar.getTime();
    }


    /**
     * 基于某个时间（baseTime）计算下n个周期的结束时间
     *
     * @param period
     * @param n
     * @param baseDate
     * @return
     * @author FD.Guo
     */
    public static Date getPeriodEnd(String period, int n, Date baseDate) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(baseDate);
        // 得到频率单位，频率值，计算开始时间
        if ("SECOND".equalsIgnoreCase(period)) {
            int s = ((getSecond(baseDate) / n + 1) * n) % 61;
            calendar.set(Calendar.SECOND, s);
            calendar.set(Calendar.MILLISECOND, 0);
        } else if ("MINUTE".equalsIgnoreCase(period)) {
            int m = ((getMinute(baseDate) / n + 1) * n) % 61;
            calendar.set(Calendar.MINUTE, m);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
        } else if ("HOUR".equalsIgnoreCase(period)) {
            int hour = getHour(baseDate);
            int h = ((hour / n + 1) * n) % 25;
            calendar.set(Calendar.HOUR_OF_DAY, h);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
        } else if ("DAY".equalsIgnoreCase(period)) {
            int d = ((getDay(baseDate) / n + 1) * n) % (getDayOfMonth(baseDate) + 1);
            calendar.set(Calendar.DAY_OF_MONTH, d);
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
        } else if ("WEEK".equalsIgnoreCase(period)) {
            int w = ((getWeek(baseDate) / n + 1) * n) % (getWeekOfYear(baseDate) + 1);
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY);
            calendar.set(Calendar.WEEK_OF_YEAR, w);
        } else if ("MONTH".equalsIgnoreCase(period)) {
            System.out.println("current mon : " + getMonth(baseDate));
            int mon = ((getMonth(baseDate) / n + 1) * n) % 13;
            System.out.println("r : " + mon);
            calendar.set(Calendar.MONTH, mon);
            calendar.set(Calendar.DAY_OF_MONTH, 1);
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
        } else if ("YEAR".equalsIgnoreCase(period)) {
            System.out.println("current y : " + getYear(baseDate));
            int y = (getYear(baseDate) / n + 1) * n;
            System.out.println("y : " + y);
            calendar.add(Calendar.YEAR, y);
            calendar.set(Calendar.MONTH, 0);
            calendar.set(Calendar.DAY_OF_MONTH, 1);
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
        }

        return calendar.getTime();
    }

    public static boolean isEffectiveDate(Date current, Date form, Date to) {//前开后闭
        if (current.compareTo(form) == 0 || form.compareTo(to) > 0) {
            return false;
        }
        if (current.compareTo(to) == 0) {
            return true;
        }
        Calendar date = Calendar.getInstance();
        date.setTime(current);
        Calendar begin = Calendar.getInstance();
        begin.setTime(form);
        Calendar end = Calendar.getInstance();
        end.setTime(to);
        System.out.println("1 : " + date.after(begin));
        System.out.println("2 : " + date.before(end));
        if (date.after(begin) && date.before(end)) {
            return true;
        } else {
            return false;
        }
    }

    //获取当年的周数
    public static int getWeekOfYear(Date date) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        // 设置周一为每周第一天
        calendar.setFirstDayOfWeek(Calendar.MONDAY);
        return calendar.getActualMaximum(Calendar.WEEK_OF_YEAR);
    }

    //java获取当前月的天数
    public static int getDayOfMonth(Date date) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        return calendar.getActualMaximum(Calendar.DATE);
    }

    public static int getYear(Date date) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        return calendar.get(Calendar.MONTH) + 1;
    }

    public static int getMonth(Date date) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        return calendar.get(Calendar.MONTH) + 1;
    }

    public static int getWeek(Date date) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        return calendar.get(Calendar.WEEK_OF_YEAR);
    }

    public static int getDay(Date date) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        return calendar.get(Calendar.DAY_OF_MONTH);
    }

    public static int getSecond(Date date) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        return calendar.get(Calendar.SECOND);
    }

    public static int getMinute(Date date) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        return calendar.get(Calendar.MINUTE);
    }

    public static int getHour(Date date) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        return calendar.get(Calendar.HOUR_OF_DAY);
    }


    /**
     * 基于某个时间（baseTime）计算 最近的上n个周期的开始时间
     * n>0 上几个周期，n=0 当前周期，n<0 下几个周期
     *
     * @param period
     * @param n
     * @param baseTime
     * @return
     * @author wxb
     */
    public static Date getPeriodStart(String period, int n, long baseTime) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(baseTime);
        // 得到频率单位，频率值，计算开始时间
        if ("SECOND".equalsIgnoreCase(period)) {
            calendar.add(Calendar.SECOND, -n);
            calendar.set(Calendar.MILLISECOND, 0);

        } else if ("MINUTE".equalsIgnoreCase(period)) {
            calendar.add(Calendar.MINUTE, -n);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);

        } else if ("HOUR".equalsIgnoreCase(period)) {
            calendar.add(Calendar.HOUR, -n);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);

        } else if ("DAY".equalsIgnoreCase(period)) {
            // 计算天
            calendar.add(Calendar.DAY_OF_MONTH, -n);
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
        } else if ("WEEK".equalsIgnoreCase(period)) {
            // 计算周
            //TODO 如何标识周的时间？
//			calendar.set(Calendar.DAY_OF_MONTH,27);
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY);
            calendar.add(Calendar.WEEK_OF_YEAR, -n);
        } else if ("BIWEEKLY".equalsIgnoreCase(period)) {
            // 计算双周
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY);
            calendar.add(Calendar.WEEK_OF_YEAR, -n * 2);
        } else if ("MONTH".equalsIgnoreCase(period)) {
            // 计算月
            calendar.add(Calendar.MONTH, -n);
            calendar.set(Calendar.DAY_OF_MONTH, 1);
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
        } else if ("QUARTER".equalsIgnoreCase(period)) {
            // 计算季度
            int currentMonth = calendar.get(Calendar.MONTH) + 1;
            //设置本季度的开始
            if (currentMonth >= 1 && currentMonth <= 3)
                calendar.set(Calendar.MONTH, 0);
            else if (currentMonth >= 4 && currentMonth <= 6)
                calendar.set(Calendar.MONTH, 3);
            else if (currentMonth >= 7 && currentMonth <= 9)
                calendar.set(Calendar.MONTH, 6);
            else if (currentMonth >= 10 && currentMonth <= 12)
                calendar.set(Calendar.MONTH, 9);
            //或者采用以下方式
            //calendar.set(Calendar.MONTH, (currentMonth - 1) - ((currentMonth - 1) % 3));
            calendar.add(Calendar.MONTH, -(n * 3));
            calendar.set(Calendar.DAY_OF_MONTH, 1);
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
        } else if ("YEAR".equalsIgnoreCase(period)) {
            calendar.add(Calendar.YEAR, -n);
            calendar.set(Calendar.MONTH, 0);
            calendar.set(Calendar.DAY_OF_MONTH, 1);
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
        }
        return calendar.getTime();
    }

    public static long beginOfToday() {
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTimeInMillis();
    }

    public static String getTimeText(long milliSeconds) {
        long day = milliSeconds / (1000 * 60 * 60 * 24);
        milliSeconds -= day * 1000 * 60 * 60 * 24;
        long hours = milliSeconds / (1000 * 60 * 60);
        milliSeconds -= hours * 1000 * 60 * 60;
        long minutes = milliSeconds / (1000 * 60);
        milliSeconds -= minutes * 1000 * 60;
        long seconds = milliSeconds / 1000;
        milliSeconds -= seconds * 1000;
        String timeText = "";
        if (day > 0) timeText += day + "d: ";
        if (hours > 0) timeText += hours + "h: ";
        if (minutes > 0) timeText += minutes + "min: ";
        if (seconds > 0) timeText += seconds + "s: ";
        if (milliSeconds > 0) timeText += milliSeconds + "ms";
        return StringUtil.isNotEmpty(timeText) ? timeText : "0ms";
    }

    public static LocalDateTime getPlusMonth(int plusMonths) {
        return LocalDateTime.now().plusMonths(plusMonths);
    }

    public static LocalDateTime getPlusDay(int plusDays) {
        return LocalDateTime.now().plusDays(plusDays);
    }

    public static Date getMonthStart(LocalDateTime now) {
        LocalDateTime start = LocalDateTime.of(now.getYear(), now.getMonth(), 1, 0, 0, 0, 0);
        return toDate(start);
    }

    public static Date getMonthEnd(LocalDateTime now) {
        LocalDateTime end = LocalDateTime.of(now.with(TemporalAdjusters.lastDayOfMonth()).getYear(),
                now.with(TemporalAdjusters.lastDayOfMonth()).getMonth(),
                now.with(TemporalAdjusters.lastDayOfMonth()).getDayOfMonth(), 23, 59, 59);
        return toDate(end);
    }

    public static Date toDate(LocalDateTime now) {
        return Date.from(now.atZone(ZoneId.systemDefault()).toInstant());
    }

    public static Date plusHours(Date date, int plusHours) {
        return toDate(date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime().plusHours(plusHours));
    }

    /**
     * 获取月初的日子
     *
     * @param date 当前日期
     * @return 月初
     */
    public static Date getMonthStart(Date date) {
        LocalDateTime now = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        LocalDateTime start = LocalDateTime.of(now.getYear(), now.getMonth(), 1, 0, 0, 0, 0);
        return Date.from(start.atZone(ZoneId.systemDefault()).toInstant());
    }

    public static Date getEndOfDay(Date date) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        calendar.set(Calendar.HOUR_OF_DAY, 23);
        calendar.set(Calendar.MINUTE, 59);
        calendar.set(Calendar.SECOND, 59);
        calendar.set(Calendar.MILLISECOND, 999);
        return calendar.getTime();
    }

    /**
     * 获取月末的日子
     *
     * @param date 当前日期
     * @return 月末
     */
    public static Date getMonthEnd(Date date) {
        LocalDateTime now = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        LocalDateTime end = LocalDateTime.of(now.with(TemporalAdjusters.lastDayOfMonth()).getYear(),
                now.with(TemporalAdjusters.lastDayOfMonth()).getMonth(),
                now.with(TemporalAdjusters.lastDayOfMonth()).getDayOfMonth(), 23, 59, 59);
        return Date.from(end.atZone(ZoneId.systemDefault()).toInstant());
    }


    /**
     * 获取指定日期所在月份结束的时间
     */
    public static Date monthEnd(Date date) {
        Calendar c = Calendar.getInstance();
        c.setTime(date);
        //设置为当月最后一天
        c.set(Calendar.DAY_OF_MONTH, c.getActualMaximum(Calendar.DAY_OF_MONTH));
        //将小时至23
        c.set(Calendar.HOUR_OF_DAY, 23);
        //将分钟至59
        c.set(Calendar.MINUTE, 59);
        //将秒至59
        c.set(Calendar.SECOND, 59);
        //将毫秒至999
        c.set(Calendar.MILLISECOND, 999);
        // 本月第一天的时间戳转换为字符串
        SimpleDateFormat sdf = new SimpleDateFormat(yyyy_MM_dd_HH_mm_ss);
        try {
            return sdf.parse(sdf.format(new Date(c.getTimeInMillis())));
        } catch (NumberFormatException | ParseException e) {
            log.error(e.getMessage(), e);
        }
        return null;
    }

    /**
     * 获取月初和月末的日子
     *
     * @param date 当前日期
     * @return [0]月初, [1]月末
     */
    public static Date[] getMonthStartAndEnd(Date date) {
        LocalDateTime now = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        LocalDateTime start = LocalDateTime.of(now.getYear(), now.getMonth(), 1, 0, 0, 0, 0);
        LocalDateTime end = LocalDateTime.of(start.with(TemporalAdjusters.lastDayOfMonth()).getYear(),
                start.with(TemporalAdjusters.lastDayOfMonth()).getMonth(),
                start.with(TemporalAdjusters.lastDayOfMonth()).getDayOfMonth(), 23, 59, 59);
        return new Date[]{Date.from(start.atZone(ZoneId.systemDefault()).toInstant()), Date.from(end.atZone(ZoneId.systemDefault()).toInstant())};
    }

    public static Date parseDate(String dateStr) throws ParseException {
        Date date;
        SimpleDateFormat dateFormat = new SimpleDateFormat();
        try {
            dateFormat.applyPattern("yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
            date = dateFormat.parse(dateStr);
        } catch (Exception e5) {
            try {
                dateFormat.applyPattern("yyyy-MM-dd hh:mm:ss");
                date = dateFormat.parse(dateStr);
            } catch (Exception e) {
                try {
                    dateFormat.applyPattern("yyyy-MM-dd hh:mm");
                    date = dateFormat.parse(dateStr);
                } catch (Exception e1) {
                    try {
                        dateFormat.applyPattern("yyyy-MM-dd");
                        date = dateFormat.parse(dateStr);
                    } catch (Exception e2) {
                        try {
                            dateFormat.applyPattern("yyyy/MM/dd hh:mm:ss");
                            date = dateFormat.parse(dateStr);
                        } catch (Exception e3) {
                            try {
                                dateFormat.applyPattern("yyyy/MM/dd hh:mm");
                                date = dateFormat.parse(dateStr);
                            } catch (Exception e4) {
                                dateFormat.applyPattern("yyyy/MM/dd");
                                date = dateFormat.parse(dateStr);
                            }
                        }
                    }
                }
            }
        }
        return date;
    }


    public static class DateNode {
        public Date startTime;
        public Date endTime;

        public DateNode() {
        }

        public DateNode(Date startTime, Date endTime) {
            this.startTime = startTime;
            this.endTime = endTime;
        }

    }

    /**
     * 根据时间区间算出有效时长（小时）
     *
     * @param list
     * @return
     */
    public static double getMixedDateRangeToHour(List<DateNode> list) {
        if (list == null || list.size() == 0) {
            return 0;
        }
        Collections.sort(list, new Comparator<DateNode>() {
            @Override
            public int compare(DateNode o1, DateNode o2) {
                if (o1.startTime.getTime() - o2.startTime.getTime() > 0) {
                    return 1;
                }
                if (o1.startTime.getTime() - o2.startTime.getTime() < 0) {
                    return -1;
                } else return 0;
            }
        });

        List<DateNode> region = new ArrayList<>();
        Queue<DateNode> queue = new LinkedList<>();
        int index = 0;
        for (DateNode k : list) {
            if (k.endTime.getTime() <= k.startTime.getTime()) {
                continue;
            }
            if (!queue.isEmpty()) {
                DateNode value = queue.poll();
                if (k.startTime.getTime() >= value.startTime.getTime() && k.startTime.getTime() < value.endTime.getTime()
                        && k.endTime.getTime() > value.endTime.getTime()) {// 以value为中心，向右有重叠
                    value.endTime = k.endTime;
                    queue.offer(value);
                } else if (k.endTime.getTime() > value.startTime.getTime()
                        && k.endTime.getTime() < value.endTime.getTime()
                        && k.startTime.getTime() < value.startTime.getTime()) {// 以value为中心，向左有重叠
                    value.startTime = k.startTime;
                    queue.offer(value);
                } else if (k.endTime.getTime() < value.startTime.getTime()
                        || k.startTime.getTime() > value.endTime.getTime()) {//不重叠
                    queue.offer(k);
                    region.add(k);
                }

                if (queue.isEmpty()) {
                    queue.offer(value);
                }

            } else if (index == 0) {
                queue.offer(k);
                region.add(k);
            }
            index++;
        }
        long time = 0;
        for (DateNode value : region) {
            time += (value.endTime.getTime() - value.startTime.getTime());
        }
        double hour = (time * 1.0 / (1000 * 60 * 60));
        BigDecimal b = new BigDecimal(hour);
        hour = b.setScale(2, BigDecimal.ROUND_HALF_UP).doubleValue();
        return hour;
    }


    /**
     * 计算两个时间之间有多少秒，或分钟，小时，天
     *
     * @param d1
     * @param d2
     * @param type
     * @return 浮点数
     */
    public static double getTimeRange(Date d1, Date d2, String type) {
        long total = (d2.getTime() - d2.getTime()) / 1000;
        double time = 0;
        if (GRANULARITY_UNIT_SECOND.equals(type)) {
            time = total;
        } else if (GRANULARITY_UNIT_MINUTE.equals(type)) {
            time = total * 1.0 / 60;
        } else if (GRANULARITY_UNIT_HOUR.equals(type)) {
            time = total * 1.0 / 60 * 60;
        } else if (GRANULARITY_UNIT_DAY.equals(type)) {
            time = total * 1.0 / 24 * 60 * 60;
        } else {
            return 0;
        }
        BigDecimal b = new BigDecimal(time);
        time = b.setScale(2, BigDecimal.ROUND_HALF_UP).doubleValue();
        return time;
    }

    /**
     * 日期对比<br>
     *
     * @return -1,0,1
     */
    public static int compare(Date date1, Date date2) {
        String sdf = "yyyy-MM-dd";
        return compare(date1, date2, sdf);
    }

    /**
     * 日期对比<br>
     *
     * @return -1,0,1
     */
    public static int compare(Date date1, Date date2, String format) {
        SimpleDateFormat sdf = new SimpleDateFormat(format);
        try {
            long dt1 = sdf.parse(sdf.format(date1)).getTime();
            long dt2 = sdf.parse(sdf.format(date2)).getTime();
            if (dt1 > dt2) {
                return 1;
            } else if (dt1 == dt2) {
                return 0;
            } else {
                return -1;
            }
        } catch (Exception ex) {
            log.error("日期对比:compare" + date1 + "," + date2 + "," + format);
        }
        return 0;
    }

    /**
     * 让日期加n<br>
     *
     * @param dt
     * @return 日期
     */
    public static Date add(Date dt, int n) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(dt);
        calendar.add(Calendar.DAY_OF_MONTH, n);
        return calendar.getTime();
    }

    /**
     * 让日期加n<br>
     *
     * @param dt
     * @return 日期
     */
    public static Date add(Date dt, Long n) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(dt);
        calendar.add(Calendar.DAY_OF_MONTH, n.intValue());
        return calendar.getTime();
    }

    /**
     * 让日期加n type(年/月/日)
     *
     * @param dt
     * @param addtype 要加的类型(年/月/日)
     * @return 日期
     */
    public static Date add(Date dt, int addtype, int n) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(dt);
        calendar.add(addtype, n);
        return calendar.getTime();
    }

    public static String getBeforeDateNormal(Date date, int days) {
        SimpleDateFormat df = new SimpleDateFormat(yyyy_MM_dd_HH_mm_ss);
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        calendar.set(Calendar.DAY_OF_YEAR, calendar.get(Calendar.DAY_OF_YEAR) - days);
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        return df.format(calendar.getTime());
    }

    /**
     * 获取日期前几天的日期
     *
     * @param date
     * @param days
     * @return
     * @throws Exception
     */
    public static String getBeforeDate(String date, int days) throws Exception {
        SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd");
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(df.parse(date));
        calendar.set(Calendar.DAY_OF_YEAR, calendar.get(Calendar.DAY_OF_YEAR)
                - days);
        return df.format(calendar.getTime());
    }

    /**
     * 获取日期前几天的日期
     *
     * @param date
     * @param days
     * @return
     * @throws Exception
     */
    public static String getBeforeDate(Date date, int days) {
        SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd");
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        calendar.set(Calendar.DAY_OF_YEAR, calendar.get(Calendar.DAY_OF_YEAR)
                - days);
        return df.format(calendar.getTime());
    }

    /**
     * 获取日期后几天的日期
     *
     * @param date
     * @param days
     * @return
     * @throws Exception
     */
    public static String getAfterDate(String date, int days) throws Exception {
        SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd");
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(df.parse(date));
        calendar.set(Calendar.DAY_OF_YEAR, calendar.get(Calendar.DAY_OF_YEAR)
                + days);
        return df.format(calendar.getTime());
    }

    /**
     * 获取日期后几天的日期
     *
     * @param date
     * @param days
     * @return
     * @throws Exception
     */
    public static String getAfterDate(Date date, int days) {
        SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd");
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        calendar.set(Calendar.DAY_OF_YEAR, calendar.get(Calendar.DAY_OF_YEAR)
                + days);
        return df.format(calendar.getTime());
    }

    /**
     * 获取某一日期当月的第一天
     */
    public static Date getFirstDayOfMonth(Date curdate) {
        Calendar lastDate = Calendar.getInstance();
        lastDate.setTime(curdate);
        lastDate.set(Calendar.DAY_OF_MONTH, 1);
        lastDate.set(Calendar.HOUR_OF_DAY, 0);
        lastDate.set(Calendar.MINUTE, 0);
        lastDate.set(Calendar.SECOND, 0);
        lastDate.set(Calendar.MILLISECOND, 0);
        return lastDate.getTime();
    }

    /**
     * 计算当月最后一天,返回字符串
     */
    public static Date getLastDayOfMonth(Date curdate) {
        Calendar lastDate = Calendar.getInstance();
        lastDate.setTime(curdate);
        lastDate.set(Calendar.DATE, 1);// 设为当前月的1号
        lastDate.add(Calendar.MONTH, 1);// 加一个月，变为下月的1号
        lastDate.add(Calendar.DATE, -1);// 减去一天，变为当月最后一天
        return lastDate.getTime();
    }

    /**
     * 求两个日期之间相隔的天数<br>
     *
     * @param startday,endday
     * @return 间隔天数
     */
    public static int getIntervalDays(Date startday, Date endday) {
        if (startday.after(endday)) {
            Date cal = startday;
            startday = endday;
            endday = cal;
        }
        long sl = startday.getTime();
        long el = endday.getTime();
        long ei = el - sl;
        return (int) (ei / (1000 * 60 * 60 * 24));
    }

    /**
     * 获取当前日期对应的星期<br>
     *
     * @param date
     * @return 当前日期是星期几
     */
    public static int getCurWeekDay(Date date) {
        GregorianCalendar cale = new GregorianCalendar(); // 格里高利日历
        cale.setTime(date); // 绑定当前日期
        return cale.get(Calendar.DAY_OF_WEEK);
    }

    /**
     * 获取当前日期是星期几<br>
     *
     * @param dt
     * @return 当前日期是星期几
     */
    public static String getWeekOfDate(Date dt) {
        String[] weekDays = {"星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"};
        Calendar cal = Calendar.getInstance();
        cal.setTime(dt);
        int w = cal.get(Calendar.DAY_OF_WEEK) - 1;
        if (w < 0)
            w = 0;
        return weekDays[w];
    }

    /**
     * 获取指定日期所在月的总天数<br>
     *
     * @param dt
     * @return 一个月总共有多少天 author qjw time 2011-04-25
     */
    public static int getMonth_Date(Date dt) {
        Calendar calendar = new GregorianCalendar();
        calendar.setTime(dt);
        return calendar.getActualMaximum(Calendar.DAY_OF_MONTH);
    }

    /**
     * 根据时间转为分钟<br>
     *
     * @param
     * @return
     */
    public static int toMinute(String starttime) {
        Calendar cld = Calendar.getInstance();
        try {
            Date date1 = new SimpleDateFormat("HH:mm").parse(starttime);
            cld.setTime(date1);
            int hour = cld.get(Calendar.HOUR_OF_DAY);
            int minute = cld.get(Calendar.MINUTE);
            minute = hour * 60 + minute;
            return minute;
        } catch (ParseException e) {
            log.error("时间格式错误！");
        }
        return 0;
    }

    /**
     * 根据分钟转为字符串<br>
     *
     * @param
     * @return
     */
    public static String minuteToStr(int minute) {
        int hour = minute / 60;
        minute = minute % 60;
        String hours = "";
        String minutes = "";
        if (String.valueOf(hour).length() != 2) {
            hours = "0" + hour;
        } else {
            hours = hour + "";
        }
        if (String.valueOf(minute).length() != 2) {
            minutes = "0" + minute;
        } else {
            minutes = minute + "";
        }
        return hours + ":" + minutes;
    }

    /**
     * 根据时间转为分钟<br>
     *
     * @param
     * @return
     */
    public static int strtoMinute(String starttime) {
        Calendar cld = Calendar.getInstance();
        try {
            Date date1 = new SimpleDateFormat("HH:mm").parse(starttime);
            cld.setTime(date1);
            int hour = cld.get(Calendar.HOUR_OF_DAY);
            int minute = cld.get(Calendar.MINUTE);
            minute = hour * 60 + minute;
            return minute;
        } catch (ParseException e) {
            log.error("时间格式错误！");
        }
        return 0;
    }

    public static String formatDate(Date date) {
        SimpleDateFormat sf = new SimpleDateFormat(yyyy_MM_dd);
        return sf.format(date);
    }

    public static String formatDatetime(Date date) {
        SimpleDateFormat sf = new SimpleDateFormat(yyyy_MM_dd_HH_mm_ss);
        return sf.format(date);
    }

    public static String formatDatetime(Date date, String format) {
        SimpleDateFormat df = new SimpleDateFormat(format);
        return df.format(date);
    }

    /**
     * yyyy-MM-dd格式时间字符串转换成日期
     *
     * @param datestr
     * @return
     */
    public static Date strToDate(String datestr) {
        return strToDate(datestr, yyyy_MM_dd_HH_mm_ss);
    }

    /**
     * 指定格式时间字符串转换成日期
     */
    public static Date strToDate(String datestr, String format) {
        SimpleDateFormat df = new SimpleDateFormat(format);
        Date date = null;
        try {
            date = df.parse(datestr);
        } catch (ParseException e) {
            log.error(e.getMessage(), e);
        }
        return date;
    }

    public static Date formatDate(Date date, String format) {
        SimpleDateFormat df = new SimpleDateFormat(format);
        String datestr = df.format(date);
        Date targetdate = null;
        try {
            targetdate = df.parse(datestr);
        } catch (ParseException e) {
            log.error(e.getMessage(), e);
        }
        return targetdate;
    }

    public static Date strToDateTime(String str) {
        SimpleDateFormat format = new SimpleDateFormat(yyyy_MM_dd_HH_mm_ss_SSS);
        Date date = null;
        try {
            date = format.parse(str);
        } catch (ParseException e) {
            log.error(e.getMessage(), e);
        }
        return date;
    }

    public static Date strToDateMode(String str) {
        SimpleDateFormat format = new SimpleDateFormat(yyyyMMdd);
        Date date = null;
        try {
            date = format.parse(str);
        } catch (ParseException e) {
        }
        return date;
    }
}
