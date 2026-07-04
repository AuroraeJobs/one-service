package com.one.record.service.impl;

import com.one.record.lottery.LotteryLedgerSummary;
import com.one.record.lottery.LotteryRecordSyncSummary;
import com.one.record.lottery.LotteryTicketPrizeCheckSummary;
import com.one.record.lottery.LotteryTicketSummary;
import com.one.record.lottery.LotteryWorkbenchDailyRunResult;
import com.one.record.lottery.LotteryWorkbenchStepResult;
import com.one.record.lottery.LotteryWorkbenchSummary;
import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.model.LotteryRecordSyncLog;
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
        List<LotteryPredictionSnapshot> predictions = trainingService.predictionHistory(1);
        LotteryTicketSummary ticketSummary = ticketService.summary();
        LotteryLedgerSummary ledgerSummary = ledgerService.summary();
        LotteryRecordSyncSummary syncSummary = recordSyncLogService.summary(SUMMARY_SYNC_LIMIT);
        return LotteryWorkbenchSummary.builder()
                .latestDraw(recordService.findLastDraw())
                .latestSyncSummary(syncSummary)
                .dataQualitySummary(dataQualityService.report())
                .latestPrediction(predictions == null || predictions.isEmpty() ? null : predictions.get(0))
                .trainingStatus(trainingService.trainingStatus())
                .pendingTicketCount(ticketSummary == null ? 0 : ticketSummary.getPendingTicketCount())
                .latestPrizeCheckSummary(latestPrizeCheckSummary)
                .ledgerSummary(ledgerSummary)
                .generatedAt(System.currentTimeMillis())
                .build();
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
