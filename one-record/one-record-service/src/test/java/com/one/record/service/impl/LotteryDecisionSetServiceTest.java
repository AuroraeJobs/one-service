package com.one.record.service.impl;

import com.one.record.lottery.LotteryDecisionOutcomeSummary;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryPerformanceLedger;
import com.one.record.lottery.LotteryPrizeResult;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryDecisionCandidateSelection;
import com.one.record.model.LotteryDecisionSet;
import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryDecisionSetRepository;
import com.one.record.repository.LotteryPredictionSnapshotRepository;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.service.ILotteryLedgerService;
import com.one.record.training.LotteryActualRecord;
import com.one.record.training.LotteryRuleEvidence;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryDecisionSetServiceTest {

    private LotteryDecisionSetRepository repository;

    private LotteryAuditEventRepository auditEventRepository;

    private LotteryTicketRepository ticketRepository;

    private LotteryPredictionSnapshotRepository predictionSnapshotRepository;

    private ILotteryLedgerService ledgerService;

    private LotteryDecisionSetService service;

    @BeforeEach
    void setUp() {
        repository = mock(LotteryDecisionSetRepository.class);
        auditEventRepository = mock(LotteryAuditEventRepository.class);
        ticketRepository = mock(LotteryTicketRepository.class);
        predictionSnapshotRepository = mock(LotteryPredictionSnapshotRepository.class);
        ledgerService = mock(ILotteryLedgerService.class);
        service = new LotteryDecisionSetService(repository, auditEventRepository, ticketRepository, predictionSnapshotRepository, ledgerService);
        when(repository.save(any(LotteryDecisionSet.class))).thenAnswer(invocation -> {
            LotteryDecisionSet decisionSet = invocation.getArgument(0);
            if (decisionSet.getId() == null) {
                decisionSet.setId("decision-1");
            }
            return decisionSet;
        });
        when(auditEventRepository.save(any(LotteryAuditEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc("default")).thenReturn(List.of());
        when(ledgerService.performance("RULE")).thenReturn(List.of());
        when(ledgerService.performance("SOURCE")).thenReturn(List.of());
    }

    @Test
    void decisionSetsReturnsActivePageByDefault() {
        when(repository.countByUserIdAndArchivedFalse("default")).thenReturn(1L);
        when(repository.findByUserIdAndArchivedFalseOrderByUpdatedAtDesc("default", PageRequest.of(0, 20)))
                .thenReturn(List.of(LotteryDecisionSet.builder().id("decision-1").archived(false).build()));

        LotteryPageResponse<LotteryDecisionSet> result = service.decisionSets(false, null, null);

        assertThat(result.getPage()).isEqualTo(1);
        assertThat(result.getPageSize()).isEqualTo(20);
        assertThat(result.getTotal()).isEqualTo(1L);
        assertThat(result.getItems()).hasSize(1);
    }

    @Test
    void createDecisionSetNormalizesCandidatesAndWritesAuditEvent() {
        ArgumentCaptor<LotteryDecisionSet> decisionCaptor = ArgumentCaptor.forClass(LotteryDecisionSet.class);
        ArgumentCaptor<LotteryAuditEvent> auditCaptor = ArgumentCaptor.forClass(LotteryAuditEvent.class);

        LotteryDecisionSet saved = service.createDecisionSet(LotteryDecisionSet.builder()
                .targetIssue(" 2026068 ")
                .ruleName(" 稳态规则 ")
                .evidenceState("stable")
                .selectedCandidates(List.of(LotteryDecisionCandidateSelection.builder()
                        .key(" row-1 ")
                        .candidateTitle(" 主预测 ")
                        .source("primary")
                        .targetPeriod(2026068)
                        .redNumbers(List.of("01", " 02 ", "02", "03", "04", "05", "06"))
                        .blueNumber(" 07 ")
                        .evidence(LotteryRuleEvidence.builder().tag("STABLE").build())
                        .ticketCount(-1)
                        .build()))
                .build());

        verify(repository).save(decisionCaptor.capture());
        verify(auditEventRepository).save(auditCaptor.capture());
        assertThat(saved.getId()).isEqualTo("decision-1");
        assertThat(decisionCaptor.getValue().getTitle()).isEqualTo("第 2026068 期决策集");
        assertThat(decisionCaptor.getValue().getUserId()).isEqualTo("default");
        assertThat(decisionCaptor.getValue().getEvidenceState()).isEqualTo("STABLE");
        assertThat(decisionCaptor.getValue().getConversionState()).isEqualTo("DRAFT");
        assertThat(decisionCaptor.getValue().getSelectedCandidates()).hasSize(1);
        assertThat(decisionCaptor.getValue().getSelectedCandidates().get(0).getRedNumbers())
                .containsExactly("01", "02", "03", "04", "05", "06");
        assertThat(decisionCaptor.getValue().getSelectedCandidates().get(0).getTicketCount()).isZero();
        assertThat(auditCaptor.getValue().getEventType()).isEqualTo("DECISION_SET_CREATE");
        assertThat(auditCaptor.getValue().getTargetType()).isEqualTo("decision-set");
        assertThat(auditCaptor.getValue().getRowCount()).isEqualTo(1);
    }

    @Test
    void outcomeSummaryAggregatesCandidateHitsTicketsAndEvidenceWarnings() {
        LotteryDecisionSet decisionSet = LotteryDecisionSet.builder()
                .id("decision-1")
                .title("第 2026068 期决策")
                .targetIssue("2026068")
                .ruleName("稳态规则")
                .conversionState("PARTIALLY_CONVERTED")
                .selectedCandidates(List.of(LotteryDecisionCandidateSelection.builder()
                        .key("candidate-1")
                        .snapshotId("snapshot-1")
                        .candidateTitle("主预测")
                        .ruleName("稳态规则")
                        .targetPeriod(2026068)
                        .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                        .blueNumber("07")
                        .evidence(LotteryRuleEvidence.builder().tag("VOLATILE").build())
                        .warning("规则波动，谨慎转票")
                        .build()))
                .build();
        LotteryActualRecord actual = new LotteryActualRecord();
        actual.setPeriod(2026068);
        actual.setRedNumbers(List.of("01", "02", "03", "08", "09", "10"));
        actual.setBlueNumber("07");
        when(repository.countByUserIdAndArchivedFalse("default")).thenReturn(1L);
        when(repository.findByUserIdAndArchivedFalseOrderByUpdatedAtDesc("default", PageRequest.of(0, 30)))
                .thenReturn(List.of(decisionSet));
        when(predictionSnapshotRepository.findAllById(List.of("snapshot-1"))).thenReturn(List.of(
                LotteryPredictionSnapshot.builder().id("snapshot-1").actualRecord(actual).build()
        ));
        when(ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc("default")).thenReturn(List.of(
                LotteryTicket.builder()
                        .id("ticket-1")
                        .issue("2026068")
                        .predictionSnapshotId("snapshot-1")
                        .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                        .blueNumber("07")
                        .source("PREDICTION")
                        .cost(new java.math.BigDecimal("2"))
                        .prizeResult(LotteryPrizeResult.builder()
                                .redHits(3)
                                .blueHit(true)
                                .prizeName("五等奖")
                                .prizeAmount(1000L)
                                .winning(true)
                                .build())
                        .build()
        ));
        when(ledgerService.performance("RULE")).thenReturn(List.of(LotteryPerformanceLedger.builder()
                .dimension("RULE")
                .key("稳态规则")
                .name("稳态规则")
                .ticketCount(10)
                .netResult(new java.math.BigDecimal("-20"))
                .roiPercent(new java.math.BigDecimal("-50"))
                .hitRatePercent(new java.math.BigDecimal("10"))
                .build()));

        LotteryDecisionOutcomeSummary summary = service.outcomeSummary(false, 30);

        assertThat(summary.getSavedDecisionSetCount()).isEqualTo(1);
        assertThat(summary.getCandidateCount()).isEqualTo(1);
        assertThat(summary.getScoredCandidateCount()).isEqualTo(1);
        assertThat(summary.getWinningCandidateCount()).isEqualTo(1);
        assertThat(summary.getConvertedTicketCount()).isEqualTo(1);
        assertThat(summary.getTotalCost()).isEqualByComparingTo("2");
        assertThat(summary.getTotalPrize()).isEqualByComparingTo("10");
        assertThat(summary.getBestRedHits()).isEqualTo(3);
        assertThat(summary.getVolatileEvidenceCount()).isEqualTo(1);
        assertThat(summary.getItems()).singleElement()
                .satisfies(item -> {
                    assertThat(item.getPrizeDistribution()).containsEntry("五等奖", 1);
                    assertThat(item.getHitDistribution()).containsEntry("3红", 1);
                    assertThat(item.getRuleDelta().getNetResultDelta()).isEqualByComparingTo("28");
                    assertThat(item.getCandidates()).singleElement()
                            .satisfies(candidate -> assertThat(candidate.getWarnings()).contains("规则波动，谨慎转票"));
                });
    }

    @Test
    void updateDecisionSetPreservesOwnershipAndWritesAuditEvent() {
        when(repository.findByIdAndUserId("decision-1", "default")).thenReturn(Optional.of(LotteryDecisionSet.builder()
                .id("decision-1")
                .userId("default")
                .createdAt(100L)
                .archived(false)
                .build()));

        LotteryDecisionSet saved = service.updateDecisionSet("decision-1", LotteryDecisionSet.builder()
                .title("复盘用决策")
                .conversionState("converted")
                .selectedCandidates(List.of())
                .build());

        assertThat(saved.getId()).isEqualTo("decision-1");
        assertThat(saved.getTitle()).isEqualTo("复盘用决策");
        assertThat(saved.getConversionState()).isEqualTo("CONVERTED");
        assertThat(saved.getAuditMetadata().getAction()).isEqualTo("decision-set-update");
        verify(auditEventRepository).save(any(LotteryAuditEvent.class));
    }

    @Test
    void archiveDecisionSetMarksArchivedAndWritesAuditEvent() {
        ArgumentCaptor<LotteryAuditEvent> auditCaptor = ArgumentCaptor.forClass(LotteryAuditEvent.class);
        when(repository.findByIdAndUserId("decision-1", "default")).thenReturn(Optional.of(LotteryDecisionSet.builder()
                .id("decision-1")
                .userId("default")
                .selectedCandidates(List.of())
                .archived(false)
                .createdAt(100L)
                .build()));

        LotteryDecisionSet archived = service.archiveDecisionSet("decision-1");

        assertThat(archived.getStatus()).isEqualTo("ARCHIVED");
        assertThat(archived.getArchived()).isTrue();
        assertThat(archived.getArchivedAt()).isNotNull();
        verify(auditEventRepository).save(auditCaptor.capture());
        assertThat(auditCaptor.getValue().getEventType()).isEqualTo("DECISION_SET_ARCHIVE");
    }
}
