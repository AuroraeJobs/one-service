package org.aurorae.cwl.util;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import org.aurorae.common.util.StreamUtil;
import org.aurorae.cwl.client.CwlCli;
import org.aurorae.cwl.file.CwlFile;
import org.aurorae.cwl.response.CwlResult;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Getter
@Setter
public class CwlCalendar {

    private static final SimpleDateFormat FORMAT = new SimpleDateFormat("yyyy-MM-dd");

    public static List<CwlResult> fetch(String now) {
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
            CwlDateUtil.nextIssue(calendar);
        } catch (ParseException e) {
            throw new RuntimeException(e);
        }
        Date startTime = calendar.getTime();
        String start = FORMAT.format(startTime);

        log.info("\n> current: {}, next: {}, today: {}", now, start, end);

        // 只有当结束时间已经过了开始时间才请求更新
        if (endTime.after(startTime)) {
            List<CwlResult> results = CwlCli.result(start, end);
            log.info("\n> {}", StreamUtil.toList(results, CwlResult::getAll));
            CwlFile.write(results);
            return results;
        }
        return null;
    }
}
