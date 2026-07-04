package com.one.record.service.impl;

import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryDecisionCandidateSelection;
import com.one.record.model.LotteryDecisionSet;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryDecisionSetRepository;
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

    private LotteryDecisionSetService service;

    @BeforeEach
    void setUp() {
        repository = mock(LotteryDecisionSetRepository.class);
        auditEventRepository = mock(LotteryAuditEventRepository.class);
        service = new LotteryDecisionSetService(repository, auditEventRepository);
        when(repository.save(any(LotteryDecisionSet.class))).thenAnswer(invocation -> {
            LotteryDecisionSet decisionSet = invocation.getArgument(0);
            if (decisionSet.getId() == null) {
                decisionSet.setId("decision-1");
            }
            return decisionSet;
        });
        when(auditEventRepository.save(any(LotteryAuditEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
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
