package com.one.record.service.impl;

import com.one.record.configuration.RecordProperties;
import com.one.record.lottery.LotteryDataQualityReport;
import com.one.record.lottery.LotteryDraw;
import com.one.record.lottery.LotteryLedgerSummary;
import com.one.record.lottery.LotteryDailyState;
import com.one.record.lottery.LotteryMaintenanceSummary;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryRecordSyncSummary;
import com.one.record.lottery.LotteryTicketPrizeCheckSummary;
import com.one.record.lottery.LotteryTicketSummary;
import com.one.record.lottery.LotteryWorkbenchDailyRunResult;
import com.one.record.lottery.LotteryWorkbenchSummary;
import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.model.LotteryRecordSyncLog;
import com.one.record.service.ILotteryDataQualityService;
import com.one.record.service.ILotteryLedgerService;
import com.one.record.service.ILotteryMaintenanceService;
import com.one.record.service.ILotteryRecordSyncLogService;
import com.one.record.service.ILotteryRecordSyncService;
import com.one.record.service.ILotteryStatisticsService;
import com.one.record.service.ILotteryTicketService;
import com.one.record.service.ILotteryTrainingService;
import com.one.record.service.IRecordService;
import com.one.record.training.LotteryTrainingStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryWorkbenchServiceTest {

    private IRecordService recordService;

    private RecordProperties recordProperties;

    private ILotteryRecordSyncService recordSyncService;

    private ILotteryRecordSyncLogService recordSyncLogService;

    private ILotteryDataQualityService dataQualityService;

    private ILotteryTrainingService trainingService;

    private ILotteryTicketService ticketService;

    private ILotteryLedgerService ledgerService;

    private ILotteryStatisticsService statisticsService;

    private ILotteryMaintenanceService maintenanceService;

    private LotteryWorkbenchService service;

    @BeforeEach
    void setUp() {
        recordService = mock(IRecordService.class);
        recordProperties = new RecordProperties();
        recordProperties.setScheduledSyncEnabled(true);
        recordSyncService = mock(ILotteryRecordSyncService.class);
        recordSyncLogService = mock(ILotteryRecordSyncLogService.class);
        dataQualityService = mock(ILotteryDataQualityService.class);
        trainingService = mock(ILotteryTrainingService.class);
        ticketService = mock(ILotteryTicketService.class);
        ledgerService = mock(ILotteryLedgerService.class);
        statisticsService = mock(ILotteryStatisticsService.class);
        maintenanceService = mock(ILotteryMaintenanceService.class);
        service = new LotteryWorkbenchService(
                recordService,
                recordProperties,
                recordSyncService,
                recordSyncLogService,
                dataQualityService,
                trainingService,
                ticketService,
                ledgerService,
                statisticsService,
                maintenanceService
        );
        mockSummaryDependencies();
    }

    @Test
    void summaryComposesExistingLotteryServices() {
        LotteryWorkbenchSummary summary = service.summary();

        assertThat(summary.getDailyState().getNextIssue()).isEqualTo("2026002");
        assertThat(summary.getLatestDraw().getIssue()).isEqualTo("2026001");
        assertThat(summary.getLatestSyncSummary().getLatestStatus()).isEqualTo("SUCCESS");
        assertThat(summary.getDataQualitySummary().getTotalRecords()).isEqualTo(10);
        assertThat(summary.getLatestPrediction().getId()).isEqualTo("snapshot-1");
        assertThat(summary.getTrainingStatus().isRunning()).isFalse();
        assertThat(summary.getPendingTicketCount()).isEqualTo(2);
        assertThat(summary.getLatestPrizeCheckSummary()).isNull();
        assertThat(summary.getLedgerSummary().getTicketCount()).isEqualTo(3);
        assertThat(summary.getScheduledSyncRunbook().getHealthStatus()).isEqualTo("READY");
        assertThat(summary.getOperationSummary().getStatus()).isEqualTo("COMPLETE");
        assertThat(summary.getMaintenanceSummary().getCollections()).isNotEmpty();
        assertThat(summary.getReleaseCheckSummary().getChecks()).extracting("key")
                .contains("sync-log-retention", "backend-tests", "commit-push");
        assertThat(summary.getGeneratedAt()).isNotNull();

        verify(recordService).findLastDraw();
        verify(recordSyncLogService).summary(50);
        verify(dataQualityService).report();
        verify(trainingService).predictionHistory(1);
        verify(trainingService).trainingStatus();
        verify(ticketService).summary();
        verify(ledgerService).summary();
    }

    @Test
    void dailyStateComposesCurrentIssueWorkflowState() {
        LotteryDailyState state = service.dailyState();

        assertThat(state.getLatestIssue()).isEqualTo("2026001");
        assertThat(state.getNextIssue()).isEqualTo("2026002");
        assertThat(state.getLatestPredictionId()).isEqualTo("snapshot-1");
        assertThat(state.getSyncState().getStatus()).isEqualTo("COMPLETE");
        assertThat(state.getPredictionState().getStatus()).isEqualTo("COMPLETE");
        assertThat(state.getTicketState().getStatus()).isEqualTo("COMPLETE");
        assertThat(state.getPrizeCheckState().getStatus()).isEqualTo("COMPLETE");
        assertThat(state.getQualityState().getStatus()).isEqualTo("COMPLETE");
        assertThat(state.getPendingActions()).isEmpty();

        verify(ticketService).ticketsPage("2026002", null, null, null, null, null, null, 1, 1);
        verify(ticketService).ticketsPage("2026001", "BOUGHT", null, null, null, null, null, 1, 1);
    }

    @Test
    void dailyStateReportsPendingActions() {
        when(recordSyncLogService.summary(50)).thenReturn(LotteryRecordSyncSummary.builder()
                .latestStatus("FAILED")
                .latestMessage("新增 1 期开奖记录，回填 2 条预测结果")
                .build());
        when(dataQualityService.report()).thenReturn(LotteryDataQualityReport.builder()
                .totalRecords(10)
                .missingIssueCount(1)
                .duplicateIssueCount(0)
                .malformedRecordCount(0)
                .futureDateCount(0)
                .build());
        when(trainingService.predictionHistory(1)).thenReturn(List.of());
        when(ticketService.ticketsPage("2026002", null, null, null, null, null, null, 1, 1))
                .thenReturn(page(0));
        when(ticketService.ticketsPage("2026001", "BOUGHT", null, null, null, null, null, 1, 1))
                .thenReturn(page(2));

        LotteryDailyState state = service.dailyState();

        assertThat(state.getSyncState().getStatus()).isEqualTo("PENDING");
        assertThat(state.getPredictionState().getStatus()).isEqualTo("PENDING");
        assertThat(state.getTicketState().getStatus()).isEqualTo("PENDING");
        assertThat(state.getPrizeCheckState().getStatus()).isEqualTo("PENDING");
        assertThat(state.getQualityState().getStatus()).isEqualTo("WARNING");
        assertThat(state.getPendingActions()).containsExactly("sync", "prediction", "tickets", "prize-check", "quality");
    }

    @Test
    void summaryReportsPendingOperationAndScheduledFailure() {
        when(recordSyncLogService.summary(50)).thenReturn(LotteryRecordSyncSummary.builder()
                .latestStatus("FAILED")
                .latestMessage("新增 1 期开奖记录，回填 2 条预测结果")
                .latestFinishedAt(200L)
                .build());
        when(recordSyncLogService.findRecent(null, 50)).thenReturn(List.of(LotteryRecordSyncLog.builder()
                .jobName("scheduled-record-sync")
                .status("FAILED")
                .failureCategory("PROXY_OR_NETWORK_BLOCK")
                .message("HTTP 403")
                .startedAt(100L)
                .finishedAt(180L)
                .build()));
        when(trainingService.predictionHistory(1)).thenReturn(List.of());
        when(ticketService.ticketsPage("2026002", null, null, null, null, null, null, 1, 1))
                .thenReturn(page(0));

        LotteryWorkbenchSummary summary = service.summary();

        assertThat(summary.getScheduledSyncRunbook().getHealthStatus()).isEqualTo("WARNING");
        assertThat(summary.getScheduledSyncRunbook().getLastDurationMs()).isEqualTo(80L);
        assertThat(summary.getOperationSummary().getStatus()).isEqualTo("PENDING");
        assertThat(summary.getOperationSummary().getLatestPredictionAttachmentCount()).isEqualTo(2);
    }

    @Test
    void dailyRunReturnsStepStatusAndFreshSummary() {
        when(recordSyncService.syncManually()).thenReturn(LotteryRecordSyncLog.builder()
                .status("SUCCESS")
                .message("saved 2")
                .savedCount(2)
                .build());
        when(trainingService.attachLatestActualToMatchingPredictions()).thenReturn(List.of(
                LotteryPredictionSnapshot.builder().id("snapshot-1").build(),
                LotteryPredictionSnapshot.builder().id("snapshot-2").build()
        ));
        when(ticketService.checkLatestPrizes()).thenReturn(LotteryTicketPrizeCheckSummary.builder()
                .issue("2026001")
                .checkedTicketCount(4)
                .winningTicketCount(1)
                .totalPrizeAmount(1000L)
                .build());

        LotteryWorkbenchDailyRunResult result = service.dailyRun();

        assertThat(result.getSteps()).extracting("step").containsExactly(
                "record-sync",
                "attach-latest-actual",
                "check-latest-prizes",
                "refresh-statistics-summary"
        );
        assertThat(result.getSteps()).extracting("status").containsOnly("SUCCESS");
        assertThat(result.getSteps().get(0).getSavedCount()).isEqualTo(2);
        assertThat(result.getSteps().get(1).getUpdatedCount()).isEqualTo(2);
        assertThat(result.getSteps().get(2).getCheckedCount()).isEqualTo(4);
        assertThat(result.getSummary().getLatestPrizeCheckSummary().getIssue()).isEqualTo("2026001");
        assertThat(result.getGeneratedAt()).isNotNull();

        verify(statisticsService).refreshSummary();
    }

    @Test
    void dailyRunKeepsLaterStepsWhenOneStepFails() {
        when(recordSyncService.syncManually()).thenThrow(new IllegalStateException("sync failed"));
        when(trainingService.attachLatestActualToMatchingPredictions()).thenReturn(List.of());
        when(ticketService.checkLatestPrizes()).thenReturn(LotteryTicketPrizeCheckSummary.builder()
                .checkedTicketCount(0)
                .winningTicketCount(0)
                .build());

        LotteryWorkbenchDailyRunResult result = service.dailyRun();

        assertThat(result.getSteps()).hasSize(4);
        assertThat(result.getSteps().get(0).getStatus()).isEqualTo("FAILED");
        assertThat(result.getSteps().get(0).getError()).isEqualTo("sync failed");
        assertThat(result.getSteps().get(1).getStatus()).isEqualTo("SUCCESS");
        assertThat(result.getSteps().get(2).getStatus()).isEqualTo("SUCCESS");
    }

    private void mockSummaryDependencies() {
        when(recordService.findLastDraw()).thenReturn(LotteryDraw.builder()
                .issue("2026001")
                .period(2026001L)
                .blueNumber("07")
                .build());
        when(recordSyncLogService.summary(50)).thenReturn(LotteryRecordSyncSummary.builder()
                .latestStatus("SUCCESS")
                .latestMessage("新增 1 期开奖记录，回填 1 条预测结果")
                .build());
        when(recordSyncLogService.findRecent(null, 50)).thenReturn(List.of(LotteryRecordSyncLog.builder()
                .jobName("scheduled-record-sync")
                .status("SUCCESS")
                .message("ok")
                .startedAt(100L)
                .finishedAt(160L)
                .build()));
        when(dataQualityService.report()).thenReturn(LotteryDataQualityReport.builder()
                .totalRecords(10)
                .missingIssueCount(0)
                .duplicateIssueCount(0)
                .malformedRecordCount(0)
                .futureDateCount(0)
                .build());
        when(trainingService.predictionHistory(1)).thenReturn(List.of(LotteryPredictionSnapshot.builder()
                .id("snapshot-1")
                .targetPeriod(2026002)
                .build()));
        when(ticketService.ticketsPage("2026002", null, null, null, null, null, null, 1, 1))
                .thenReturn(page(1));
        when(ticketService.ticketsPage("2026001", "BOUGHT", null, null, null, null, null, 1, 1))
                .thenReturn(page(0));
        LotteryTrainingStatus status = new LotteryTrainingStatus();
        status.setRunning(false);
        status.setPercent(100);
        when(trainingService.trainingStatus()).thenReturn(status);
        when(ticketService.summary()).thenReturn(LotteryTicketSummary.builder()
                .ticketCount(3)
                .pendingTicketCount(2)
                .build());
        when(ledgerService.summary()).thenReturn(LotteryLedgerSummary.builder()
                .ticketCount(3)
                .totalCost(new BigDecimal("6"))
                .build());
        when(maintenanceService.summary()).thenReturn(LotteryMaintenanceSummary.builder()
                .collections(List.of(
                        collection("lottery_record_sync_logs", 3, 0, 0),
                        collection("lottery_provider_probe_logs", 2, 0, 0),
                        collection("lottery_audit_events", 4, 0, 0),
                        collection("lottery_training_reports", 1, 0, 0),
                        collection("lottery_prediction_rules", 1, 0, 0)
                ))
                .generatedAt(1000L)
                .build());
    }

    private static LotteryMaintenanceSummary.CollectionStatus collection(String name, long total, long stale, long oversized) {
        return LotteryMaintenanceSummary.CollectionStatus.builder()
                .collection(name)
                .totalCount(total)
                .staleCount(stale)
                .oversizedBy(oversized)
                .cleanupSupported(true)
                .build();
    }

    private static LotteryPageResponse<com.one.record.model.LotteryTicket> page(long total) {
        return LotteryPageResponse.<com.one.record.model.LotteryTicket>builder()
                .items(List.of())
                .page(1)
                .pageSize(1)
                .total(total)
                .hasNext(false)
                .build();
    }
}
