package com.one.record.service.impl;

import com.one.record.lottery.LotteryDecisionCandidateOutcome;
import com.one.record.lottery.LotteryDecisionOutcomeItem;
import com.one.record.lottery.LotteryDecisionOutcomeSummary;
import com.one.record.lottery.LotteryExportResult;
import com.one.record.lottery.LotteryIssueLedger;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryResearchProvenance;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryBacktestReport;
import com.one.record.model.LotteryDecisionCandidateSelection;
import com.one.record.model.LotteryDecisionSet;
import com.one.record.model.LotteryPredictionRuleRecord;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryBacktestReportRepository;
import com.one.record.repository.LotteryDecisionSetRepository;
import com.one.record.repository.LotteryPredictionSnapshotRepository;
import com.one.record.repository.LotteryProviderProbeLogRepository;
import com.one.record.repository.LotteryRecordSyncLogRepository;
import com.one.record.repository.LotteryStrategyExperimentRepository;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.service.ILotteryDecisionSetService;
import com.one.record.service.ILotteryLedgerService;
import com.one.record.service.ILotteryTrainingService;
import com.one.record.training.LotteryRuleComparison;
import com.one.record.training.LotteryRuleEvidence;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryExportServiceTest {

    private LotteryTicketRepository ticketRepository;

    private LotteryAuditEventRepository auditEventRepository;

    private LotteryDecisionSetRepository decisionSetRepository;

    private LotteryBacktestReportRepository backtestReportRepository;

    private ILotteryLedgerService ledgerService;

    private ILotteryTrainingService trainingService;

    private ILotteryDecisionSetService decisionSetService;

    private LotteryExportService service;

    @BeforeEach
    void setUp() {
        ticketRepository = mock(LotteryTicketRepository.class);
        auditEventRepository = mock(LotteryAuditEventRepository.class);
        decisionSetRepository = mock(LotteryDecisionSetRepository.class);
        backtestReportRepository = mock(LotteryBacktestReportRepository.class);
        ledgerService = mock(ILotteryLedgerService.class);
        trainingService = mock(ILotteryTrainingService.class);
        decisionSetService = mock(ILotteryDecisionSetService.class);
        service = new LotteryExportService(
                ticketRepository,
                decisionSetRepository,
                mock(LotteryPredictionSnapshotRepository.class),
                mock(LotteryStrategyExperimentRepository.class),
                backtestReportRepository,
                mock(LotteryRecordSyncLogRepository.class),
                mock(LotteryProviderProbeLogRepository.class),
                auditEventRepository,
                ledgerService,
                trainingService,
                decisionSetService
        );
        when(auditEventRepository.save(any(LotteryAuditEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void exportTicketsBuildsStableCsvAndAuditEvent() {
        when(ticketRepository.findAll(any(Sort.class))).thenReturn(List.of(
                LotteryTicket.builder()
                        .id("ticket-1")
                        .issue("2026079")
                        .status("BOUGHT")
                        .source("MANUAL")
                        .quantity(2)
                        .cost(new BigDecimal("4"))
                        .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                        .blueNumber("07")
                        .createdAt(100L)
                        .build(),
                LotteryTicket.builder()
                        .id("ticket-2")
                        .issue("2026079")
                        .status("DRAFT")
                        .source("MANUAL")
                        .quantity(1)
                        .cost(new BigDecimal("2"))
                        .build()
        ));
        ArgumentCaptor<LotteryAuditEvent> captor = ArgumentCaptor.forClass(LotteryAuditEvent.class);

        LotteryExportResult result = service.export("tickets", Map.of("status", "BOUGHT", "limit", "10"));

        assertThat(result.getExportType()).isEqualTo("tickets");
        assertThat(result.getRowCount()).isEqualTo(1);
        assertThat(result.getContent()).startsWith("id,issue,status,source,quantity,cost,redNumbers,blueNumber,prizeGrade,createdAt");
        assertThat(result.getContent()).contains("ticket-1,2026079,BOUGHT,MANUAL,2,4,01 02 03 04 05 06,07,,100");
        verify(auditEventRepository).save(captor.capture());
        assertThat(captor.getValue().getRowCount()).isEqualTo(1);
        assertThat(captor.getValue().getFilters()).containsEntry("status", "BOUGHT");
    }

    @Test
    void exportLedgerRowsUsesLedgerService() {
        when(ledgerService.issues()).thenReturn(List.of(LotteryIssueLedger.builder()
                .issue("2026079")
                .ticketCount(2)
                .totalCost(new BigDecimal("4"))
                .netResult(new BigDecimal("-4"))
                .build()));

        LotteryExportResult result = service.export("ledger-issues", Map.of("issue", "2026079"));

        assertThat(result.getRowCount()).isEqualTo(1);
        assertThat(result.getContent()).contains("2026079");
    }

    @Test
    void exportRuleEvidenceUsesTrainingComparison() {
        when(trainingService.comparePredictionRules(10)).thenReturn(LotteryRuleComparison.builder()
                .rules(List.of(LotteryPredictionRuleRecord.builder()
                        .id("record-1")
                        .ruleId("rule-1")
                        .ruleName("稳态规则")
                        .rankScore(88)
                        .evidence(LotteryRuleEvidence.builder()
                                .tag("STABLE")
                                .label("稳定")
                                .score(82)
                                .message("证据稳定")
                                .reasons(List.of("稳定分 86"))
                                .build())
                        .build()))
                .build());

        LotteryExportResult result = service.export("rule-evidence", Map.of("limit", "10"));

        assertThat(result.getExportType()).isEqualTo("rule-evidence");
        assertThat(result.getRowCount()).isEqualTo(1);
        assertThat(result.getContent()).contains("ruleId,ruleName");
        assertThat(result.getContent()).contains("STABLE");
        assertThat(result.getContent()).contains("稳定分 86");
    }

    @Test
    void exportDecisionSetsUsesSavedDecisionRecords() {
        when(decisionSetRepository.findAll(any(Sort.class))).thenReturn(List.of(LotteryDecisionSet.builder()
                .id("decision-1")
                .title("复盘决策")
                .targetIssue("2026068")
                .ruleName("稳态规则")
                .conversionState("PARTIALLY_CONVERTED")
                .provenance(miniGptProvenance())
                .reviewAction("WATCH")
                .reviewBacktestId("backtest-1")
                .reviewedAt(200L)
                .selectedCandidates(List.of(LotteryDecisionCandidateSelection.builder()
                        .key("candidate-1")
                        .generationId("generation-1")
                        .build()))
                .build()));

        LotteryExportResult result = service.export("decision-sets", Map.of("targetIssue", "2026068"));

        assertThat(result.getExportType()).isEqualTo("decision-sets");
        assertThat(result.getRowCount()).isEqualTo(1);
        assertThat(result.getContent()).contains("decision-1,复盘决策,2026068,稳态规则");
        assertThat(result.getContent()).contains("candidateKeys,candidateGenerationIds");
        assertThat(result.getContent()).contains("candidate-1,generation-1");
        assertThat(result.getContent()).contains("WATCH,backtest-1,200");
        assertThat(result.getContent()).contains("batchId,runId,runName,corpusVersion");
        assertThat(result.getContent()).contains("batch-1,run-1,minigpt-run,corpus-v1");
    }

    @Test
    void exportBacktestsIncludesComparableRandomBaselineAndResearchLineage() {
        when(backtestReportRepository.findAll(any(Sort.class))).thenReturn(List.of(LotteryBacktestReport.builder()
                .id("backtest-1")
                .decisionSetId("decision-1")
                .strategyName("MiniGPT balanced")
                .presetWindow("latest30")
                .issueStart("2026049")
                .issueEnd("2026078")
                .replayCount(30)
                .baselineSeed(42L)
                .baselineAlgorithm("FNV1A64_JAVA_RANDOM_V1")
                .windowIssueCount(30)
                .candidateCount(2)
                .uniqueCandidateCount(2)
                .ticketCount(60)
                .baselineTicketCount(60)
                .sameWindow(true)
                .sameBudget(true)
                .averageRedHits(new BigDecimal("1.47"))
                .baselineAverageRedHits(new BigDecimal("1.20"))
                .averageRedHitsDelta(new BigDecimal("0.27"))
                .blueHitRate(new BigDecimal("12.50"))
                .baselineBlueHitRate(new BigDecimal("8.33"))
                .blueHitRateDelta(new BigDecimal("4.17"))
                .totalCost(new BigDecimal("60"))
                .baselineTotalCost(new BigDecimal("60"))
                .totalPrize(new BigDecimal("75"))
                .baselineTotalPrize(new BigDecimal("50"))
                .totalPrizeDelta(new BigDecimal("25"))
                .netResult(new BigDecimal("-40"))
                .baselineNetResult(new BigDecimal("-50"))
                .netResultDelta(new BigDecimal("10"))
                .roiPercent(new BigDecimal("-66.67"))
                .baselineRoiPercent(new BigDecimal("-83.33"))
                .roiPercentDelta(new BigDecimal("16.66"))
                .candidateDiversity(new BigDecimal("1.0"))
                .maxRedOverlap(0)
                .distinctBlueCount(1)
                .evaluationMode("STATIC_POOL_HISTORICAL_REPLAY")
                .overfitWarnings(List.of("UNKNOWN_CORPUS_WINDOW", "LOW_CANDIDATE_DIVERSITY"))
                .provenance(miniGptProvenance())
                .createdAt(300L)
                .build()));

        LotteryExportResult result = service.export("backtests", Map.of("strategyName", "minigpt"));

        assertThat(result.getRowCount()).isEqualTo(1);
        assertThat(result.getContent()).contains("decisionSetId,strategyName");
        assertThat(result.getContent()).contains("baselineSeed,baselineAlgorithm");
        assertThat(result.getContent()).contains("42,FNV1A64_JAVA_RANDOM_V1");
        assertThat(result.getContent()).contains("sameWindow,sameBudget");
        assertThat(result.getContent()).contains("true,true");
        assertThat(result.getContent()).contains("averageRedHits,baselineAverageRedHits,averageRedHitsDelta");
        assertThat(result.getContent()).contains("1.47,1.20,0.27");
        assertThat(result.getContent()).contains("blueHitRate,baselineBlueHitRate,blueHitRateDelta");
        assertThat(result.getContent()).contains("12.50,8.33,4.17");
        assertThat(result.getContent()).contains("totalPrize,baselineTotalPrize,totalPrizeDelta");
        assertThat(result.getContent()).contains("75,50,25");
        assertThat(result.getContent()).contains("-40,-50,10");
        assertThat(result.getContent()).contains("\"'=HYPERLINK(\"\"https://example.test\"\",\"\"research\"\")\rnext\"");
        assertThat(result.getContent()).contains("STATIC_POOL_HISTORICAL_REPLAY");
        assertThat(result.getContent()).contains("UNKNOWN_CORPUS_WINDOW | LOW_CANDIDATE_DIVERSITY");
        assertThat(result.getContent()).contains("batch-1,run-1,minigpt-run,corpus-v1");
    }

    @Test
    void exportDecisionOutcomesFlattensCandidateRows() {
        when(decisionSetService.outcomeSummary(null, 10)).thenReturn(LotteryDecisionOutcomeSummary.builder()
                .items(List.of(LotteryDecisionOutcomeItem.builder()
                        .decisionSetId("decision-1")
                        .title("复盘决策")
                        .targetIssue("2026068")
                        .reviewAction("WATCH")
                        .reviewBacktestId("backtest-1")
                        .backtestNetResultDelta(new BigDecimal("10"))
                        .backtestRoiPercentDelta(new BigDecimal("16.66"))
                        .backtestWarnings(List.of("STATIC_POOL_HISTORICAL_REPLAY"))
                        .provenance(miniGptProvenance())
                        .candidates(List.of(LotteryDecisionCandidateOutcome.builder()
                                .candidateKey("candidate-1")
                                .generationId("generation-1")
                                .candidateTitle("主预测")
                                .ruleName("稳态规则")
                                .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                                .blueNumber("07")
                                .redHits(3)
                                .blueHit(true)
                                .prizeName("五等奖")
                                .resultState("WON")
                                .totalCost(new BigDecimal("2"))
                                .totalPrize(new BigDecimal("10"))
                                .netResult(new BigDecimal("8"))
                                .warnings(List.of("规则波动"))
                                .build()))
                        .build()))
                .build());
        when(backtestReportRepository.findAllById(any())).thenReturn(List.of(
                comparableReport("backtest-1", "decision-1", miniGptProvenance())
        ));

        LotteryExportResult result = service.export("decision-outcomes", Map.of("limit", "10"));

        assertThat(result.getExportType()).isEqualTo("decision-outcomes");
        assertThat(result.getRowCount()).isEqualTo(1);
        assertThat(result.getContent()).contains("candidate-1");
        assertThat(result.getContent()).contains("规则波动");
        assertThat(result.getContent()).contains("WATCH,backtest-1");
        assertThat(result.getContent()).contains("STATIC_POOL_HISTORICAL_REPLAY");
        assertThat(result.getContent()).contains("generation-1");
        assertThat(result.getContent()).contains("batch-1,run-1,minigpt-run,corpus-v1");
        assertThat(csvRow(result, 0)).containsEntry("reviewBacktestOwnershipState", "EXACT_OWNED");
    }

    @Test
    void exportDecisionOutcomesCarriesFiveStateObservedOnlySnapshotWithoutCountingCandidateRows() {
        LotteryResearchProvenance candidateProvenance = miniGptProvenance();
        candidateProvenance.setValidationLatestIssue("2027000");
        LotteryDecisionOutcomeItem observed = outcomeItem(
                "decision-observed",
                "2026080",
                1,
                miniGptProvenance(),
                List.of(
                        outcomeCandidate("candidate-observed-1", candidateProvenance),
                        outcomeCandidate("candidate-observed-2", candidateProvenance)
                )
        );
        observed.setReviewBacktestId("backtest-observed");
        observed.setConvertedTicketCount(1);
        observed.setCheckedConvertedTicketCount(1);
        observed.setTotalCost(new BigDecimal("2"));
        observed.setTotalPrize(new BigDecimal("0"));

        LotteryResearchProvenance unknownProvenance = miniGptProvenance();
        unknownProvenance.setValidationLatestIssue("26078");
        LotteryDecisionOutcomeSummary snapshot = LotteryDecisionOutcomeSummary.builder()
                .items(List.of(
                        outcomeItem("decision-train", "2023001", 1, miniGptProvenance(), List.of()),
                        outcomeItem("decision-validation", "2025002", 1, miniGptProvenance(), List.of()),
                        outcomeItem("decision-pending", "2026079", 0, miniGptProvenance(), List.of()),
                        observed,
                        outcomeItem("decision-unknown", "2026081", 1, unknownProvenance, List.of()),
                        outcomeItem("decision-other", "2026082", 1, null, List.of())
                ))
                .build();
        LotteryBacktestReport exactReport = comparableReport("backtest-observed", "decision-observed", miniGptProvenance());
        when(decisionSetService.outcomeSummary(null, 10)).thenReturn(LotteryDecisionOutcomeSummary.builder()
                .items(List.of(observed))
                .build());
        when(decisionSetService.outcomeSummary(true, 100)).thenReturn(snapshot);
        when(decisionSetRepository.countByUserId("default")).thenReturn(103L);
        when(backtestReportRepository.findAllById(any())).thenReturn(List.of(exactReport));

        LotteryExportResult result = service.export("decision-outcomes", Map.of("limit", "10"));

        assertThat(result.getRowCount()).isEqualTo(2);
        Map<String, String> first = csvRow(result, 0);
        Map<String, String> second = csvRow(result, 1);
        assertThat(first)
                .containsEntry("boundaryClassifierVersion", "MINIGPT_TEMPORAL_BOUNDARY_V1")
                .containsEntry("boundarySource", "DECISION_PROVENANCE_PLUS_EXACT_DECISION_OUTCOME")
                .containsEntry("boundaryTrainSha256", "train-sha")
                .containsEntry("boundaryValidationSha256", "validation-sha")
                .containsEntry("boundaryCheckpointSha256", "checkpoint-sha")
                .containsEntry("boundaryValidationLatestIssue", "2026078")
                .containsEntry("decisionBoundaryState", "POST_CORPUS_OBSERVED")
                .containsEntry("decisionBoundaryObservedEligible", "true")
                .containsEntry("decisionIncludedInObservationSnapshot", "true")
                .containsEntry("decisionBoundaryMatchesObservationSnapshot", "true")
                .containsEntry("snapshotTrainWindowDecisionCount", "1")
                .containsEntry("snapshotValidationWindowDecisionCount", "1")
                .containsEntry("snapshotPostCorpusPendingDecisionCount", "1")
                .containsEntry("snapshotPostCorpusObservedDecisionCount", "1")
                .containsEntry("snapshotUnknownDecisionCount", "1")
                .containsEntry("snapshotObservedDecisionDenominator", "1")
                .containsEntry("snapshotObservedDistinctIssueDenominator", "1")
                .containsEntry("snapshotObservedScoredCandidateDenominator", "1")
                .containsEntry("snapshotObservedFinancialDecisionDenominator", "1")
                .containsEntry("observationSnapshotLoadedDecisionCount", "6")
                .containsEntry("observationSnapshotTotalDecisionCount", "103")
                .containsEntry("observationSnapshotTruncated", "true")
                .containsEntry("observationSnapshotMiniGptDecisionCount", "5")
                .containsEntry("observationSnapshotExcludedNonMiniGptCount", "1")
                .containsEntry("snapshotAggregationSemantics", "REPEATED_SNAPSHOT_METADATA_DO_NOT_SUM")
                .containsEntry("reviewBacktestOwnershipState", "EXACT_OWNED")
                .containsEntry("reviewedBaselineComparabilityState", "COMPARABLE")
                .containsEntry("comparableBacktestRoiPercentDelta", "16.66");
        assertThat(second.get("snapshotObservedDecisionDenominator")).isEqualTo("1");
        assertThat(second.get("decisionBoundaryState")).isEqualTo("POST_CORPUS_OBSERVED");
        assertThat(first.get("observationSafetyNotice"))
                .contains("do not extrapolate future performance")
                .contains("do not sum them")
                .contains("No automatic approval or ticket creation");
    }

    @Test
    void exportDecisionOutcomesReusesArchivedHundredDecisionScopeForMiniGptReviewPreset() {
        LotteryDecisionOutcomeSummary summary = LotteryDecisionOutcomeSummary.builder()
                .items(List.of(outcomeItem(
                        "decision-observed",
                        "2026080",
                        1,
                        miniGptProvenance(),
                        List.of(outcomeCandidate("candidate-observed", null))
                )))
                .build();
        when(decisionSetService.outcomeSummary(true, 500)).thenReturn(summary);

        LotteryExportResult result = service.export("decision-outcomes", Map.of(
                "includeArchived", "true",
                "limit", "500"
        ));

        assertThat(result.getRowCount()).isEqualTo(1);
        assertThat(csvRow(result, 0))
                .containsEntry("observationSnapshotLoadedDecisionCount", "1")
                .containsEntry("decisionBoundaryMatchesObservationSnapshot", "true")
                .containsEntry("decisionContributesToSnapshotObservedDenominator", "true");
        verify(decisionSetService).outcomeSummary(true, 500);
        verify(decisionSetService, never()).outcomeSummary(true, 100);
    }

    @Test
    void exportDecisionOutcomesDoesNotCallInvalidLimitACompleteHundredDecisionSnapshot() {
        LotteryDecisionOutcomeItem detail = outcomeItem(
                "decision-detail",
                "2026080",
                1,
                miniGptProvenance(),
                List.of(outcomeCandidate("candidate-detail", null))
        );
        LotteryDecisionOutcomeItem older = outcomeItem(
                "decision-older",
                "2026081",
                0,
                miniGptProvenance(),
                List.of()
        );
        when(decisionSetService.outcomeSummary(true, null)).thenReturn(LotteryDecisionOutcomeSummary.builder()
                .items(List.of(detail))
                .build());
        when(decisionSetService.outcomeSummary(true, 100)).thenReturn(LotteryDecisionOutcomeSummary.builder()
                .items(List.of(detail, older))
                .build());

        LotteryExportResult result = service.export("decision-outcomes", Map.of(
                "includeArchived", "true",
                "limit", "not-a-number"
        ));

        assertThat(csvRow(result, 0))
                .containsEntry("observationSnapshotLoadedDecisionCount", "2")
                .containsEntry("snapshotPostCorpusObservedDecisionCount", "1")
                .containsEntry("snapshotPostCorpusPendingDecisionCount", "1");
        verify(decisionSetService).outcomeSummary(true, null);
        verify(decisionSetService).outcomeSummary(true, 100);
    }

    @Test
    void exportDecisionOutcomesDoesNotPromoteLatestOrWrongOwnerBacktestToReviewedEvidence() {
        LotteryDecisionOutcomeItem wrongOwner = outcomeItem(
                "decision-wrong-owner",
                "2026080",
                1,
                miniGptProvenance(),
                List.of(outcomeCandidate("candidate-wrong-owner", null))
        );
        wrongOwner.setReviewBacktestId("backtest-wrong-owner");
        wrongOwner.setBacktestRoiPercentDelta(new BigDecimal("88.88"));
        LotteryDecisionOutcomeItem unbound = outcomeItem(
                "decision-unbound",
                "2026081",
                1,
                miniGptProvenance(),
                List.of(outcomeCandidate("candidate-unbound", null))
        );
        unbound.setBacktestRoiPercentDelta(new BigDecimal("99.99"));
        LotteryDecisionOutcomeSummary summary = LotteryDecisionOutcomeSummary.builder()
                .items(List.of(wrongOwner, unbound))
                .build();
        when(decisionSetService.outcomeSummary(null, 10)).thenReturn(summary);
        when(decisionSetService.outcomeSummary(true, 100)).thenReturn(summary);
        when(backtestReportRepository.findAllById(any())).thenReturn(List.of(
                comparableReport("backtest-wrong-owner", "another-decision", miniGptProvenance())
        ));

        LotteryExportResult result = service.export("decision-outcomes", Map.of("limit", "10"));

        Map<String, Map<String, String>> rowsByDecision = resultRows(result).stream()
                .collect(java.util.stream.Collectors.toMap(row -> row.get("decisionSetId"), row -> row));
        assertThat(rowsByDecision.get("decision-wrong-owner"))
                .containsEntry("reviewBacktestOwnershipState", "OWNER_MISMATCH")
                .containsEntry("reviewedBacktestRoiPercentDelta", "")
                .containsEntry("reviewedBaselineComparabilityState", "UNKNOWN")
                .containsEntry("reviewedBaselineComparabilityReasons", "DECISION_OWNER_MISMATCH")
                .containsEntry("comparableBacktestRoiPercentDelta", "")
                .containsEntry("decisionBoundaryState", "POST_CORPUS_OBSERVED");
        assertThat(rowsByDecision.get("decision-unbound"))
                .containsEntry("reviewBacktestOwnershipState", "UNBOUND")
                .containsEntry("reviewedBacktestRoiPercentDelta", "")
                .containsEntry("reviewedBaselineComparabilityState", "UNKNOWN")
                .containsEntry("reviewedBaselineComparabilityReasons", "MISSING_REVIEW_BINDING")
                .containsEntry("comparableBacktestRoiPercentDelta", "")
                .containsEntry("backtestRoiPercentDelta", "")
                .containsEntry("backtestWarnings", "");
    }

    @Test
    void exportBudgetPrechecksUsesAuditEvidence() {
        when(auditEventRepository.findAll(any(Sort.class))).thenReturn(List.of(LotteryAuditEvent.builder()
                .eventType("TICKET_BUDGET_PRECHECK")
                .targetType("tickets-budget")
                .filters(Map.of("budgetStatus", "WARNING", "proposedTicketCount", "2"))
                .rowCount(2)
                .message("Prechecked lottery ticket budget")
                .generatedAt(100L)
                .build()));

        LotteryExportResult result = service.export("budget-prechecks", Map.of("status", "WARNING"));

        assertThat(result.getExportType()).isEqualTo("budget-prechecks");
        assertThat(result.getRowCount()).isEqualTo(1);
        assertThat(result.getContent()).contains("WARNING");
        assertThat(result.getContent()).contains("proposedTicketCount");
    }

    @Test
    void auditEventsUsesSharedPageEnvelope() {
        when(auditEventRepository.count()).thenReturn(11L);
        when(auditEventRepository.findByOrderByGeneratedAtDesc(PageRequest.of(1, 5))).thenReturn(List.of(
                LotteryAuditEvent.builder().eventType("EXPORT").targetType("tickets").build()
        ));

        LotteryPageResponse<LotteryAuditEvent> result = service.auditEvents(2, 5);

        assertThat(result.getPage()).isEqualTo(2);
        assertThat(result.getPageSize()).isEqualTo(5);
        assertThat(result.getTotal()).isEqualTo(11L);
        assertThat(result.getHasNext()).isTrue();
        assertThat(result.getItems()).hasSize(1);
    }

    private LotteryResearchProvenance miniGptProvenance() {
        return LotteryResearchProvenance.builder()
                .sourceType("MINIGPT")
                .generationId("generation-1")
                .batchId("batch-1")
                .runId("run-1")
                .runName("minigpt-run")
                .corpusVersion("corpus-v1")
                .trainSha256("train-sha")
                .validationSha256("validation-sha")
                .checkpointSha256("checkpoint-sha")
                .prompt("=HYPERLINK(\"https://example.test\",\"research\")\rnext")
                .seed(42L)
                .strategyLabel("balanced")
                .trainFirstIssue("2023001")
                .trainLatestIssue("2025001")
                .validationFirstIssue("2025002")
                .validationLatestIssue("2026078")
                .batchBaseSeed(42L)
                .batchStrategies(List.of("balanced", "blue-focus"))
                .capturedAt(100L)
                .build();
    }

    private LotteryDecisionOutcomeItem outcomeItem(String decisionSetId,
                                                   String targetIssue,
                                                   Integer scoredCandidateCount,
                                                   LotteryResearchProvenance provenance,
                                                   List<LotteryDecisionCandidateOutcome> candidates) {
        return LotteryDecisionOutcomeItem.builder()
                .decisionSetId(decisionSetId)
                .title(decisionSetId)
                .targetIssue(targetIssue)
                .scoredCandidateCount(scoredCandidateCount)
                .provenance(provenance)
                .candidates(candidates)
                .build();
    }

    private LotteryDecisionCandidateOutcome outcomeCandidate(String key, LotteryResearchProvenance provenance) {
        return LotteryDecisionCandidateOutcome.builder()
                .candidateKey(key)
                .candidateTitle(key)
                .provenance(provenance)
                .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                .blueNumber("07")
                .resultState("WON")
                .redHits(3)
                .build();
    }

    private LotteryBacktestReport comparableReport(String id,
                                                   String decisionSetId,
                                                   LotteryResearchProvenance provenance) {
        return LotteryBacktestReport.builder()
                .id(id)
                .decisionSetId(decisionSetId)
                .provenance(provenance)
                .sameWindow(true)
                .sameBudget(true)
                .ticketCount(10)
                .baselineTicketCount(10)
                .windowIssueCount(5)
                .baselineAlgorithm("FNV1A64_JAVA_RANDOM_V1")
                .baselineSeed(42L)
                .evaluationMode("STATIC_POOL_HISTORICAL_REPLAY")
                .averageRedHitsDelta(new BigDecimal("0.20"))
                .blueHitRateDelta(new BigDecimal("1.00"))
                .totalPrizeDelta(new BigDecimal("4"))
                .netResultDelta(new BigDecimal("10"))
                .roiPercentDelta(new BigDecimal("16.66"))
                .overfitWarnings(List.of("STATIC_POOL_HISTORICAL_REPLAY"))
                .build();
    }

    private List<Map<String, String>> resultRows(LotteryExportResult result) {
        String[] lines = result.getContent().split("\\n", -1);
        List<String> headers = parseCsvLine(lines[0]);
        List<Map<String, String>> rows = new ArrayList<>();
        for (int index = 1; index < lines.length; index++) {
            List<String> values = parseCsvLine(lines[index]);
            Map<String, String> row = new LinkedHashMap<>();
            for (int column = 0; column < headers.size(); column++) {
                row.put(headers.get(column), column < values.size() ? values.get(column) : "");
            }
            rows.add(row);
        }
        return rows;
    }

    private Map<String, String> csvRow(LotteryExportResult result, int rowIndex) {
        return resultRows(result).get(rowIndex);
    }

    private List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder value = new StringBuilder();
        boolean quoted = false;
        for (int index = 0; index < line.length(); index++) {
            char current = line.charAt(index);
            if (current == '"') {
                if (quoted && index + 1 < line.length() && line.charAt(index + 1) == '"') {
                    value.append('"');
                    index += 1;
                } else {
                    quoted = !quoted;
                }
            } else if (current == ',' && !quoted) {
                values.add(value.toString());
                value.setLength(0);
            } else {
                value.append(current);
            }
        }
        values.add(value.toString());
        return values;
    }
}
