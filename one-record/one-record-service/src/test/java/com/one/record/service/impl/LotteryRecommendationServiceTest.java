package com.one.record.service.impl;

import com.one.record.lottery.LotteryOutcomeAttribution;
import com.one.record.lottery.LotteryRecommendationStatusRequest;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryRecommendation;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryRecommendationRepository;
import com.one.record.service.ILotteryOutcomeAttributionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LotteryRecommendationServiceTest {

    private LotteryRecommendationRepository repository;

    private ILotteryOutcomeAttributionService outcomeService;

    private LotteryAuditEventRepository auditEventRepository;

    private LotteryRecommendationService service;

    @BeforeEach
    void setUp() {
        repository = mock(LotteryRecommendationRepository.class);
        outcomeService = mock(ILotteryOutcomeAttributionService.class);
        auditEventRepository = mock(LotteryAuditEventRepository.class);
        when(repository.save(any(LotteryRecommendation.class))).thenAnswer(invocation -> {
            LotteryRecommendation recommendation = invocation.getArgument(0);
            if (recommendation.getId() == null) {
                recommendation.setId(recommendation.getTargetType() + "-" + recommendation.getTargetId());
            }
            return recommendation;
        });
        when(auditEventRepository.save(any(LotteryAuditEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        service = new LotteryRecommendationService(repository, outcomeService, auditEventRepository);
    }

    @Test
    void refreshCreatesRecommendationsFromOutcomeAttribution() {
        when(outcomeService.recent(3)).thenReturn(List.of(LotteryOutcomeAttribution.builder()
                .issue("2026068")
                .calibrationState("PROMOTE_SIGNAL")
                .roiPercent(new BigDecimal("120.00"))
                .winningTicketCount(1)
                .decisionContributions(List.of(LotteryOutcomeAttribution.DecisionContribution.builder()
                        .decisionSetId("decision-1")
                        .title("决策")
                        .ruleName("rule-a")
                        .winningCandidateCount(1)
                        .roiPercent(new BigDecimal("80.00"))
                        .contributionState("POSITIVE")
                        .build()))
                .portfolioContributions(List.of(LotteryOutcomeAttribution.PortfolioContribution.builder()
                        .portfolioId("portfolio-1")
                        .name("稳态组合")
                        .healthScore(88)
                        .warningCount(0)
                        .linkedDecisionCount(1)
                        .contributionState("LINKED")
                        .build()))
                .simulationDrifts(List.of(LotteryOutcomeAttribution.SimulationDrift.builder()
                        .auditId("audit-1")
                        .riskLevel("MEDIUM")
                        .actualWinningTicketCount(1)
                        .driftState("CONFIRMED_SIGNAL")
                        .generatedAt(System.currentTimeMillis())
                        .build()))
                .build()));
        when(repository.findByUserIdAndArchivedFalseOrderByUpdatedAtDesc("default", PageRequest.of(0, 20))).thenReturn(List.of(
                LotteryRecommendation.builder().id("issue").recommendationState("PROMOTE").build()
        ));
        when(repository.countByUserIdAndArchivedFalse("default")).thenReturn(4L);

        var page = service.refresh(3);

        assertThat(page.getTotal()).isEqualTo(4);
    }

    @Test
    void updateStatusArchivesRecommendationAndKeepsNoteReason() {
        when(repository.findByIdAndUserId("rec-1", "default")).thenReturn(Optional.of(LotteryRecommendation.builder()
                .id("rec-1")
                .userId("default")
                .recommendationState("WATCH")
                .reasons(List.of("初始原因"))
                .createdAt(100L)
                .build()));

        LotteryRecommendation saved = service.updateStatus("rec-1", LotteryRecommendationStatusRequest.builder()
                .lifecycleStatus("ARCHIVED")
                .note("已处理")
                .build());

        assertThat(saved.getLifecycleStatus()).isEqualTo("ARCHIVED");
        assertThat(saved.getArchived()).isTrue();
        assertThat(saved.getReasons()).contains("初始原因", "已处理");
    }
}
