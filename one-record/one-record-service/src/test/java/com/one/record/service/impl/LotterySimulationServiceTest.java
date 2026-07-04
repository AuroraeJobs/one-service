package com.one.record.service.impl;

import com.one.record.lottery.LotterySimulationRequest;
import com.one.record.lottery.LotterySimulationResult;
import com.one.record.lottery.LotteryStrategyPortfolioSummary;
import com.one.record.lottery.LotteryTicketBudgetPrecheckResult;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryPredictionSnapshotRepository;
import com.one.record.service.ILotteryStrategyPortfolioService;
import com.one.record.service.ILotteryTicketService;
import com.one.record.training.LotteryPredictionCandidate;
import com.one.record.training.LotteryReplaySummary;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotterySimulationServiceTest {

    private LotteryPredictionSnapshotRepository predictionSnapshotRepository;

    private ILotteryTicketService ticketService;

    private ILotteryStrategyPortfolioService portfolioService;

    private LotteryAuditEventRepository auditEventRepository;

    private LotterySimulationService service;

    @BeforeEach
    void setUp() {
        predictionSnapshotRepository = mock(LotteryPredictionSnapshotRepository.class);
        ticketService = mock(ILotteryTicketService.class);
        portfolioService = mock(ILotteryStrategyPortfolioService.class);
        auditEventRepository = mock(LotteryAuditEventRepository.class);
        when(auditEventRepository.save(any(LotteryAuditEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        service = new LotterySimulationService(predictionSnapshotRepository, ticketService, portfolioService, auditEventRepository);
    }

    @Test
    void simulateUsesLatestPredictionCandidatesAndBudgetPrecheck() {
        LotteryPredictionCandidate candidate = new LotteryPredictionCandidate();
        candidate.setTitle("候选A");
        candidate.setRedNumbers(List.of("01", "02", "03", "04", "05", "06"));
        candidate.setBlueNumber("07");
        candidate.setScore(88);
        LinkedHashMap<String, Integer> hitDistribution = new LinkedHashMap<>();
        hitDistribution.put("3", 5);
        when(predictionSnapshotRepository.findByOrderByCreatedAtDesc(PageRequest.of(0, 1))).thenReturn(List.of(LotteryPredictionSnapshot.builder()
                .id("snapshot-1")
                .targetPeriod(2026068)
                .redNumbers(List.of("08", "09", "10", "11", "12", "13"))
                .blueNumber("14")
                .score(90)
                .candidates(List.of(candidate))
                .replaySummary(LotteryReplaySummary.builder()
                        .replayWindow(60)
                        .recentAverageScore(12.5)
                        .candidateRedHitDistribution(hitDistribution)
                        .build())
                .build()));
        when(ticketService.budgetPrecheck(any())).thenReturn(LotteryTicketBudgetPrecheckResult.builder()
                .status("OK")
                .proposedCost(new BigDecimal("4.00"))
                .build());
        when(portfolioService.detail("portfolio-1")).thenReturn(LotteryStrategyPortfolioSummary.builder()
                .healthStatus("WARNING")
                .warningCount(1)
                .roiPercent(new BigDecimal("10.00"))
                .build());

        LotterySimulationResult result = service.simulate(LotterySimulationRequest.builder()
                .portfolioIds(List.of("portfolio-1"))
                .budgetLimit(new BigDecimal("10.00"))
                .build());

        assertThat(result.getTargetIssue()).isEqualTo("2026068");
        assertThat(result.getCandidateCount()).isEqualTo(2);
        assertThat(result.getReplayWindow()).isEqualTo(60);
        assertThat(result.getRiskLevel()).isEqualTo("MEDIUM");
        assertThat(result.getWarnings()).contains("策略组合存在 1 项证据警示");
        assertThat(result.getHitDistribution()).containsEntry("3", 5);
        ArgumentCaptor<LotteryAuditEvent> auditCaptor = ArgumentCaptor.forClass(LotteryAuditEvent.class);
        verify(auditEventRepository).save(auditCaptor.capture());
        assertThat(auditCaptor.getValue().getEventType()).isEqualTo("LOTTERY_SIMULATION_RUN");
    }

    @Test
    void simulateFlagsBudgetLimitAndUsesProvidedTickets() {
        when(predictionSnapshotRepository.findByOrderByCreatedAtDesc(PageRequest.of(0, 1))).thenReturn(List.of());
        when(ticketService.budgetPrecheck(any())).thenReturn(LotteryTicketBudgetPrecheckResult.builder()
                .status("OVER")
                .proposedCost(new BigDecimal("20.00"))
                .build());

        LotterySimulationResult result = service.simulate(LotterySimulationRequest.builder()
                .targetIssue("2026069")
                .budgetLimit(new BigDecimal("5.00"))
                .candidateTickets(List.of(LotteryTicket.builder()
                        .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                        .blueNumber("07")
                        .cost(new BigDecimal("22.00"))
                        .build()))
                .build());

        assertThat(result.getRiskLevel()).isEqualTo("HIGH");
        assertThat(result.getWarnings()).contains("模拟成本超过沙盘预算", "预算预检状态：OVER");
        assertThat(result.getCandidates()).hasSize(1);
        assertThat(result.getCandidates().get(0).getWarning()).isEqualTo("单注成本较高");
    }
}
