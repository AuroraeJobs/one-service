package com.one.record.web;

import com.one.record.request.RecordRequest;
import com.one.record.lottery.LotteryDraw;
import com.one.record.lottery.LotteryRecordSyncSummary;
import com.one.record.model.LotteryRecordSyncLog;
import com.one.record.response.Record;
import com.one.record.response.RecordYearCount;
import com.one.record.service.IRecordService;
import com.one.record.service.ILotteryRecordSyncLogService;
import com.one.record.service.ILotteryRecordSyncService;
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

    private final ILotteryRecordSyncLogService syncLogService;

    private final ILotteryRecordSyncService syncService;

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

    @GetMapping("draws/latest")
    @Operation(summary = "查询最新标准化开奖记录", description = "返回标准化 LotteryDraw DTO")
    public LotteryDraw latestDraw() {
        return service.findLastDraw();
    }

    @GetMapping("draws/first")
    @Operation(summary = "查询首期标准化开奖记录", description = "返回标准化 LotteryDraw DTO")
    public LotteryDraw firstDraw() {
        return service.findFirstDraw();
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

    @GetMapping("draws")
    @Operation(summary = "查询标准化开奖记录", description = "按期号、日期或行号范围分页查询标准化 LotteryDraw DTO")
    public List<LotteryDraw> draws(@RequestParam(value = "issueStart", required = false) String issueStart,
                                   @RequestParam(value = "issueEnd", required = false) String issueEnd,
                                   @RequestParam(value = "dayStart", required = false) String dayStart,
                                   @RequestParam(value = "dayEnd", required = false) String dayEnd,
                                   @RequestParam(value = "lineStart", required = false, defaultValue = "0") long lineStart,
                                   @RequestParam(value = "lineEnd", required = false, defaultValue = "0") long lineEnd,
                                   @RequestParam(value = "page", required = false, defaultValue = "0") int page,
                                   @RequestParam(value = "size", required = false, defaultValue = "50") int size) {
        return service.findDraws(recordRequest(issueStart, issueEnd, dayStart, dayEnd, lineStart, lineEnd), page, size);
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
    public LotteryRecordSyncLog sync() {
        log.info("Syncing lottery records");
        return syncService.syncManually();
    }

    @PostMapping("sync/retry")
    @Operation(summary = "重试开奖记录同步", description = "按手动同步语义重新触发一次开奖记录同步")
    public LotteryRecordSyncLog retrySync() {
        log.info("Retrying lottery record sync");
        return syncService.syncManually();
    }

    @PostMapping("sync/scheduled")
    @Operation(summary = "手动触发定时开奖记录同步", description = "按定时任务语义立即触发一次开奖记录同步")
    public LotteryRecordSyncLog scheduledSync() {
        log.info("Triggering scheduled lottery record sync");
        return syncService.syncScheduled();
    }

    @GetMapping("sync-logs")
    @Operation(summary = "查询开奖记录同步日志", description = "查询最近的开奖记录同步日志，可按状态过滤")
    public List<LotteryRecordSyncLog> syncLogs(@RequestParam(value = "status", required = false) String status,
                                               @RequestParam(value = "limit", required = false, defaultValue = "50") int limit) {
        return syncLogService.findRecent(status, limit);
    }

    @GetMapping("sync-summary")
    @Operation(summary = "查询开奖记录同步摘要", description = "聚合最近的开奖记录同步日志，返回状态计数、成功率、最近结果和耗时指标")
    public LotteryRecordSyncSummary syncSummary(@RequestParam(value = "limit", required = false, defaultValue = "50") int limit) {
        return syncLogService.summary(limit);
    }

    private static boolean hasFilter(RecordRequest request) {
        return StringUtils.hasText(request.getIssueStart()) && StringUtils.hasText(request.getIssueEnd())
                || StringUtils.hasText(request.getDayStart()) && StringUtils.hasText(request.getDayEnd())
                || request.getLineStart() != 0 && request.getLineEnd() != 0;
    }

    private static RecordRequest recordRequest(String issueStart, String issueEnd, String dayStart, String dayEnd,
                                               long lineStart, long lineEnd) {
        RecordRequest request = new RecordRequest();
        request.setIssueStart(issueStart);
        request.setIssueEnd(issueEnd);
        request.setDayStart(dayStart);
        request.setDayEnd(dayEnd);
        request.setLineStart(lineStart);
        request.setLineEnd(lineEnd);
        return request;
    }

}
