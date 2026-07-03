package com.one.record.web;

import com.one.record.request.RecordRequest;
import com.one.record.response.Record;
import com.one.record.response.RecordYearCount;
import com.one.record.service.IRecordService;
import com.one.record.service.IRecordUpdate;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("lottery/records")
@AllArgsConstructor
public class LotteryRecordController {

    private final IRecordService service;

    private final IRecordUpdate recordUpdate;

    @GetMapping("latest")
    @Operation(summary = "查询最新开奖记录", description = "从数据库获取最新一期彩票开奖记录")
    public Record latest() {
        return service.findLast();
    }

    @GetMapping("first")
    @Operation(summary = "查询首期开奖记录", description = "从数据库获取最早一期彩票开奖记录")
    public Record first() {
        return service.findFirst();
    }

    @GetMapping
    @Operation(summary = "查询开奖记录", description = "按期号、日期或行号范围查询彩票开奖记录；不传条件时返回全部记录")
    public List<Record> records(@RequestParam(value = "issueStart", required = false) String issueStart,
                                @RequestParam(value = "issueEnd", required = false) String issueEnd,
                                @RequestParam(value = "dayStart", required = false) String dayStart,
                                @RequestParam(value = "dayEnd", required = false) String dayEnd,
                                @RequestParam(value = "lineStart", required = false, defaultValue = "0") long lineStart,
                                @RequestParam(value = "lineEnd", required = false, defaultValue = "0") long lineEnd) {
        RecordRequest request = new RecordRequest();
        request.setIssueStart(issueStart);
        request.setIssueEnd(issueEnd);
        request.setDayStart(dayStart);
        request.setDayEnd(dayEnd);
        request.setLineStart(lineStart);
        request.setLineEnd(lineEnd);
        if (hasFilter(request)) {
            return service.find(request);
        }
        return service.findAll();
    }

    @GetMapping("yearly-counts")
    @Operation(summary = "查询年度开奖记录数", description = "从 Redis 获取年度开奖记录数统计")
    public List<RecordYearCount> yearlyCounts() {
        return service.getYearCounts();
    }

    @PostMapping("yearly-counts/statistics")
    @Operation(summary = "统计年度开奖记录数", description = "按开奖日期年份统计记录数，并保存到 Redis")
    public List<RecordYearCount> refreshYearlyCounts() {
        return service.countByYear();
    }

    @PostMapping("sync")
    @Operation(summary = "同步开奖记录", description = "触发现有开奖记录更新流程；保留 record/update 兼容入口")
    public void sync() {
        log.info("Syncing lottery records");
        recordUpdate.update();
    }

    private static boolean hasFilter(RecordRequest request) {
        return StringUtils.hasText(request.getIssueStart()) && StringUtils.hasText(request.getIssueEnd())
                || StringUtils.hasText(request.getDayStart()) && StringUtils.hasText(request.getDayEnd())
                || request.getLineStart() != 0 && request.getLineEnd() != 0;
    }
}
