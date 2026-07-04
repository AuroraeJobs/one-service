package com.one.record.service.impl;

import com.one.record.lottery.LotteryDecisionCandidateOutcome;
import com.one.record.lottery.LotteryDecisionOutcomeItem;
import com.one.record.lottery.LotteryDecisionOutcomeSummary;
import com.one.record.lottery.LotteryExportResult;
import com.one.record.lottery.LotteryIssueLedger;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryAuditEvent;
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
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryExportServiceTest {

    private LotteryTicketRepository ticketRepository;

    private LotteryAuditEventRepository auditEventRepository;

    private LotteryDecisionSetRepository decisionSetRepository;

    private ILotteryLedgerService ledgerService;

    private ILotteryTrainingService trainingService;

    private ILotteryDecisionSetService decisionSetService;

    private LotteryExportService service;

    @BeforeEach
    void setUp() {
        ticketRepository = mock(LotteryTicketRepository.class);
        auditEventRepository = mock(LotteryAuditEventRepository.class);
        decisionSetRepository = mock(LotteryDecisionSetRepository.class);
        ledgerService = mock(ILotteryLedgerService.class);
        trainingService = mock(ILotteryTrainingService.class);
        decisionSetService = mock(ILotteryDecisionSetService.class);
        service = new LotteryExportService(
                ticketRepository,
                decisionSetRepository,
                mock(LotteryPredictionSnapshotRepository.class),
                mock(LotteryStrategyExperimentRepository.class),
                mock(LotteryBacktestReportRepository.class),
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
                .selectedCandidates(List.of())
                .build()));

        LotteryExportResult result = service.export("decision-sets", Map.of("targetIssue", "2026068"));

        assertThat(result.getExportType()).isEqualTo("decision-sets");
        assertThat(result.getRowCount()).isEqualTo(1);
        assertThat(result.getContent()).contains("decision-1,复盘决策,2026068,稳态规则");
    }

    @Test
    void exportDecisionOutcomesFlattensCandidateRows() {
        when(decisionSetService.outcomeSummary(null, 10)).thenReturn(LotteryDecisionOutcomeSummary.builder()
                .items(List.of(LotteryDecisionOutcomeItem.builder()
                        .decisionSetId("decision-1")
                        .title("复盘决策")
                        .targetIssue("2026068")
                        .candidates(List.of(LotteryDecisionCandidateOutcome.builder()
                                .candidateKey("candidate-1")
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

        LotteryExportResult result = service.export("decision-outcomes", Map.of("limit", "10"));

        assertThat(result.getExportType()).isEqualTo("decision-outcomes");
        assertThat(result.getRowCount()).isEqualTo(1);
        assertThat(result.getContent()).contains("candidate-1");
        assertThat(result.getContent()).contains("规则波动");
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
}
