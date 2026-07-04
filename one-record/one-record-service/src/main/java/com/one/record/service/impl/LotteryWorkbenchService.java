package com.one.record.service.impl;

import com.one.record.lottery.LotteryLedgerSummary;
import com.one.record.lottery.LotteryDailyState;
import com.one.record.lottery.LotteryRecordSyncSummary;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryTicketPrizeCheckSummary;
import com.one.record.lottery.LotteryTicketSummary;
import com.one.record.lottery.LotteryWorkbenchDailyRunResult;
import com.one.record.lottery.LotteryWorkbenchStepResult;
import com.one.record.lottery.LotteryWorkbenchSummary;
import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.model.LotteryRecordSyncLog;
import com.one.record.model.LotteryTicket;
import com.one.record.service.ILotteryDataQualityService;
import com.one.record.service.ILotteryLedgerService;
import com.one.record.service.ILotteryRecordSyncLogService;
import com.one.record.service.ILotteryRecordSyncService;
import com.one.record.service.ILotteryStatisticsService;
import com.one.record.service.ILotteryTicketService;
import com.one.record.service.ILotteryTrainingService;
import com.one.record.service.ILotteryWorkbenchService;
import com.one.record.service.IRecordService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.function.Supplier;

@Slf4j
@Service
@AllArgsConstructor
public class LotteryWorkbenchService implements ILotteryWorkbenchService {

    private static final int SUMMARY_SYNC_LIMIT = 50;

    private final IRecordService recordService;

    private final ILotteryRecordSyncService recordSyncService;

    private final ILotteryRecordSyncLogService recordSyncLogService;

    private final ILotteryDataQualityService dataQualityService;

    private final ILotteryTrainingService trainingService;

    private final ILotteryTicketService ticketService;

    private final ILotteryLedgerService ledgerService;

    private final ILotteryStatisticsService statisticsService;

    @Override
    public LotteryWorkbenchSummary summary() {
        return buildSummary(null);
    }

    @Override
    public LotteryDailyState dailyState() {
        return buildDailyState(
                recordService.findLastDraw(),
                latestPrediction(),
                recordSyncLogService.summary(SUMMARY_SYNC_LIMIT),
                dataQualityService.report()
        );
    }

    @Override
    public LotteryWorkbenchDailyRunResult dailyRun() {
        List<LotteryWorkbenchStepResult> steps = new ArrayList<>();
        steps.add(runStep("record-sync", () -> {
            LotteryRecordSyncLog log = recordSyncService.syncManually();
            return LotteryWorkbenchStepResult.builder()
                    .status(log == null ? null : log.getStatus())
                    .message(log == null ? "开奖记录同步已触发" : log.getMessage())
                    .savedCount(log == null ? null : log.getSavedCount())
                    .build();
        }));
        steps.add(runStep("attach-latest-actual", () -> {
            List<LotteryPredictionSnapshot> updated = trainingService.attachLatestActualToMatchingPredictions();
            return LotteryWorkbenchStepResult.builder()
                    .message("已回填匹配预测")
                    .updatedCount(updated == null ? 0 : updated.size())
                    .build();
        }));
        LotteryTicketPrizeCheckSummary[] latestPrizeCheckSummary = new LotteryTicketPrizeCheckSummary[1];
        steps.add(runStep("check-latest-prizes", () -> {
            LotteryTicketPrizeCheckSummary checked = ticketService.checkLatestPrizes();
            latestPrizeCheckSummary[0] = checked;
            return LotteryWorkbenchStepResult.builder()
                    .message("已按最新开奖核奖")
                    .checkedCount(checked == null ? 0 : checked.getCheckedTicketCount())
                    .updatedCount(checked == null ? 0 : checked.getWinningTicketCount())
                    .build();
        }));
        steps.add(runStep("refresh-statistics-summary", () -> {
            statisticsService.refreshSummary();
            return LotteryWorkbenchStepResult.builder()
                    .message("统计摘要已刷新")
                    .build();
        }));
        long now = System.currentTimeMillis();
        return LotteryWorkbenchDailyRunResult.builder()
                .steps(steps)
                .summary(buildSummary(latestPrizeCheckSummary[0]))
                .generatedAt(now)
                .build();
    }

    private LotteryWorkbenchSummary buildSummary(LotteryTicketPrizeCheckSummary latestPrizeCheckSummary) {
        LotteryPredictionSnapshot latestPrediction = latestPrediction();
        LotteryTicketSummary ticketSummary = ticketService.summary();
        LotteryLedgerSummary ledgerSummary = ledgerService.summary();
        LotteryRecordSyncSummary syncSummary = recordSyncLogService.summary(SUMMARY_SYNC_LIMIT);
        com.one.record.lottery.LotteryDraw latestDraw = recordService.findLastDraw();
        com.one.record.lottery.LotteryDataQualityReport qualityReport = dataQualityService.report();
        LotteryDailyState dailyState = buildDailyState(latestDraw, latestPrediction, syncSummary, qualityReport);
        return LotteryWorkbenchSummary.builder()
                .dailyState(dailyState)
                .latestDraw(latestDraw)
                .latestSyncSummary(syncSummary)
                .dataQualitySummary(qualityReport)
                .latestPrediction(latestPrediction)
                .trainingStatus(trainingService.trainingStatus())
                .pendingTicketCount(ticketSummary == null ? 0 : ticketSummary.getPendingTicketCount())
                .latestPrizeCheckSummary(latestPrizeCheckSummary)
                .ledgerSummary(ledgerSummary)
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    private LotteryPredictionSnapshot latestPrediction() {
        List<LotteryPredictionSnapshot> predictions = trainingService.predictionHistory(1);
        return predictions == null || predictions.isEmpty() ? null : predictions.get(0);
    }

    private LotteryDailyState buildDailyState(com.one.record.lottery.LotteryDraw latestDraw,
                                              LotteryPredictionSnapshot latestPrediction,
                                              LotteryRecordSyncSummary syncSummary,
                                              com.one.record.lottery.LotteryDataQualityReport qualityReport) {
        String latestIssue = latestDraw == null ? null : latestDraw.getIssue();
        String nextIssue = resolveNextIssue(latestDraw, latestPrediction);
        int qualityIssueCount = qualityIssueCount(qualityReport);
        LotteryPageResponse<LotteryTicket> nextIssueTickets = hasText(nextIssue)
                ? ticketService.ticketsPage(nextIssue, null, null, null, null, null, null, 1, 1)
                : emptyTicketPage();
        LotteryPageResponse<LotteryTicket> pendingPrizeTickets = hasText(latestIssue)
                ? ticketService.ticketsPage(latestIssue, "BOUGHT", null, null, null, null, null, 1, 1)
                : emptyTicketPage();
        boolean syncComplete = "SUCCESS".equals(syncSummary == null ? null : syncSummary.getLatestStatus());
        boolean predictionReady = latestPrediction != null
                && latestPrediction.getTargetPeriod() != null
                && Objects.equals(String.valueOf(latestPrediction.getTargetPeriod()), nextIssue);
        boolean ticketsReady = total(nextIssueTickets) > 0;
        boolean prizeCheckReady = total(pendingPrizeTickets) == 0;
        boolean qualityReady = qualityIssueCount == 0;
        List<String> pendingActions = new ArrayList<>();
        if (!syncComplete) {
            pendingActions.add("sync");
        }
        if (!predictionReady) {
            pendingActions.add("prediction");
        }
        if (!ticketsReady) {
            pendingActions.add("tickets");
        }
        if (!prizeCheckReady) {
            pendingActions.add("prize-check");
        }
        if (!qualityReady) {
            pendingActions.add("quality");
        }
        return LotteryDailyState.builder()
                .latestIssue(latestIssue)
                .nextIssue(nextIssue)
                .latestPredictionId(latestPrediction == null ? null : latestPrediction.getId())
                .syncState(item(
                        "sync",
                        "同步",
                        syncComplete ? "COMPLETE" : "PENDING",
                        syncComplete ? "最近同步成功" : "同步状态待确认",
                        "/lottery/sync",
                        syncComplete ? 0 : 1,
                        syncSummary == null ? null : syncSummary.getLatestFinishedAt()
                ))
                .predictionState(item(
                        "prediction",
                        "预测",
                        predictionReady ? "COMPLETE" : "PENDING",
                        predictionReady ? "下一期预测已生成" : "下一期预测待生成或待确认",
                        predictionReady && latestPrediction != null && hasText(latestPrediction.getId())
                                ? "/lottery/predictions/" + latestPrediction.getId()
                                : "/lottery/predictions/history?targetPeriod=" + nullToEmpty(nextIssue),
                        predictionReady ? 0 : 1,
                        latestPrediction == null ? null : latestPrediction.getUpdatedAt()
                ))
                .ticketState(item(
                        "tickets",
                        "票据",
                        ticketsReady ? "COMPLETE" : "PENDING",
                        ticketsReady ? "下一期已有票据记录" : "下一期票据待确认",
                        "/lottery/tickets?issue=" + nullToEmpty(nextIssue),
                        ticketsReady ? 0 : 1,
                        null
                ))
                .prizeCheckState(item(
                        "prize-check",
                        "核奖",
                        prizeCheckReady ? "COMPLETE" : "PENDING",
                        prizeCheckReady ? "最近开奖票据已处理" : "最近开奖仍有待核奖票据",
                        "/lottery/tickets?issue=" + nullToEmpty(latestIssue) + "&status=BOUGHT",
                        total(pendingPrizeTickets),
                        null
                ))
                .qualityState(item(
                        "quality",
                        "质检",
                        qualityReady ? "COMPLETE" : "WARNING",
                        qualityReady ? "数据质量正常" : "存在数据质量问题",
                        "/lottery/data-quality",
                        qualityIssueCount,
                        qualityReport == null ? null : qualityReport.getGeneratedAt()
                ))
                .pendingActions(pendingActions)
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    private static LotteryDailyState.DailyStateItem item(String key,
                                                         String label,
                                                         String status,
                                                         String message,
                                                         String path,
                                                         Integer pendingCount,
                                                         Long updatedAt) {
        return LotteryDailyState.DailyStateItem.builder()
                .key(key)
                .label(label)
                .status(status)
                .message(message)
                .path(path)
                .pendingCount(pendingCount)
                .updatedAt(updatedAt)
                .build();
    }

    private static LotteryPageResponse<LotteryTicket> emptyTicketPage() {
        return LotteryPageResponse.<LotteryTicket>builder()
                .items(List.of())
                .page(1)
                .pageSize(1)
                .total(0L)
                .hasNext(false)
                .build();
    }

    private static int total(LotteryPageResponse<LotteryTicket> response) {
        Long total = response == null ? null : response.getTotal();
        return total == null ? 0 : total.intValue();
    }

    private static int qualityIssueCount(com.one.record.lottery.LotteryDataQualityReport report) {
        if (report == null) {
            return 0;
        }
        return safe(report.getMissingIssueCount())
                + safe(report.getDuplicateIssueCount())
                + safe(report.getMalformedRecordCount())
                + safe(report.getFutureDateCount());
    }

    private static int safe(Integer value) {
        return value == null ? 0 : value;
    }

    private static String resolveNextIssue(com.one.record.lottery.LotteryDraw latestDraw, LotteryPredictionSnapshot latestPrediction) {
        if (latestDraw != null && latestDraw.getPeriod() != null) {
            return String.valueOf(latestDraw.getPeriod() + 1);
        }
        if (latestPrediction != null && latestPrediction.getTargetPeriod() != null) {
            return String.valueOf(latestPrediction.getTargetPeriod());
        }
        return null;
    }

    private static boolean hasText(String value) {
        return StringUtils.hasText(value);
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private LotteryWorkbenchStepResult runStep(String step, Supplier<LotteryWorkbenchStepResult> supplier) {
        long startedAt = System.currentTimeMillis();
        try {
            LotteryWorkbenchStepResult result = supplier.get();
            String status = result != null && StringUtils.hasText(result.getStatus()) ? result.getStatus() : "SUCCESS";
            return merge(step, status, startedAt, System.currentTimeMillis(), result, null);
        } catch (RuntimeException exception) {
            log.warn("彩票工作台日常步骤失败: step={}", step, exception);
            return merge(step, "FAILED", startedAt, System.currentTimeMillis(), null, exception.getMessage());
        }
    }

    private static LotteryWorkbenchStepResult merge(String step,
                                                    String status,
                                                    long startedAt,
                                                    long finishedAt,
                                                    LotteryWorkbenchStepResult result,
                                                    String error) {
        return LotteryWorkbenchStepResult.builder()
                .step(step)
                .status(status)
                .message(result == null ? null : result.getMessage())
                .startedAt(startedAt)
                .finishedAt(finishedAt)
                .savedCount(result == null ? null : result.getSavedCount())
                .checkedCount(result == null ? null : result.getCheckedCount())
                .updatedCount(result == null ? null : result.getUpdatedCount())
                .error(error)
                .build();
    }
}
