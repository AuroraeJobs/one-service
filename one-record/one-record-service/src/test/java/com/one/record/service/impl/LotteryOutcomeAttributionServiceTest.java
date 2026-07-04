package com.one.record.service.impl;

import com.one.record.lottery.LotteryDecisionOutcomeItem;
import com.one.record.lottery.LotteryDecisionOutcomeSummary;
import com.one.record.lottery.LotteryOutcomeAttribution;
import com.one.record.lottery.LotteryPrizeResult;
import com.one.record.lottery.LotteryStrategyPortfolioSummary;
import com.one.record.lottery.LotteryTicketBudgetPrecheckResult;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryStrategyPortfolio;
import com.one.record.model.LotteryTicket;
import com.one.record.model.LotteryTicketPack;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryTicketPackRepository;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.service.ILotteryDecisionSetService;
import com.one.record.service.ILotteryStrategyPortfolioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LotteryOutcomeAttributionServiceTest {

    private LotteryTicketRepository ticketRepository;

    private LotteryTicketPackRepository ticketPackRepository;

    private LotteryAuditEventRepository auditEventRepository;

    private ILotteryDecisionSetService decisionSetService;

    private ILotteryStrategyPortfolioService portfolioService;

    private LotteryOutcomeAttributionService service;

    @BeforeEach
    void setUp() {
        ticketRepository = mock(LotteryTicketRepository.class);
        ticketPackRepository = mock(LotteryTicketPackRepository.class);
        auditEventRepository = mock(LotteryAuditEventRepository.class);
        decisionSetService = mock(ILotteryDecisionSetService.class);
        portfolioService = mock(ILotteryStrategyPortfolioService.class);
        when(auditEventRepository.save(any(LotteryAuditEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        service = new LotteryOutcomeAttributionService(ticketRepository, ticketPackRepository, auditEventRepository, decisionSetService, portfolioService);
    }

    @Test
    void issueBuildsOutcomeAttributionAcrossTicketsPacksDecisionsAndSimulations() {
        when(ticketRepository.findByUserIdAndIssueOrderByCreatedAtDesc("default", "2026068")).thenReturn(List.of(LotteryTicket.builder()
                .id("ticket-1")
                .issue("2026068")
                .cost(new BigDecimal("2.00"))
                .prizeResult(LotteryPrizeResult.builder()
                        .redHits(4)
                        .blueHit(true)
                        .winning(true)
                        .prizeName("四等奖")
                        .prizeAmount(200L)
                        .build())
                .updatedAt(200L)
                .build()));
        when(ticketPackRepository.findByUserIdOrderByUpdatedAtDesc("default", PageRequest.of(0, 100))).thenReturn(List.of(LotteryTicketPack.builder()
                .id("pack-1")
                .title("执行票包")
                .targetIssue("2026068")
                .status("SAVED")
                .approvalState("APPROVED")
                .savedTicketIds(List.of("ticket-1"))
                .budgetPrecheck(LotteryTicketBudgetPrecheckResult.builder().proposedCost(new BigDecimal("2.00")).build())
                .updatedAt(300L)
                .build()));
        when(decisionSetService.outcomeSummary(false, 100)).thenReturn(LotteryDecisionOutcomeSummary.builder()
                .items(List.of(LotteryDecisionOutcomeItem.builder()
                        .decisionSetId("decision-1")
                        .title("决策")
                        .targetIssue("2026068")
                        .winningCandidateCount(1)
                        .netResult(new BigDecimal("198.00"))
                        .roiPercent(new BigDecimal("9900.00"))
                        .status("ACTIVE")
                        .updatedAt(250L)
                        .build()))
                .build());
        when(portfolioService.portfolios(false, 1, 50)).thenReturn(com.one.record.lottery.LotteryPageResponse.<LotteryStrategyPortfolioSummary>builder()
                .items(List.of(LotteryStrategyPortfolioSummary.builder()
                        .portfolio(LotteryStrategyPortfolio.builder().id("portfolio-1").name("稳态组合").build())
                        .healthScore(90)
                        .healthStatus("PASS")
                        .roiPercent(new BigDecimal("12.00"))
                        .evidence(List.of(LotteryStrategyPortfolioSummary.EvidenceSummary.builder()
                                .evidenceType("DECISION")
                                .sourceId("decision-1")
                                .build()))
                        .build()))
                .build());
        LinkedHashMap<String, String> filters = new LinkedHashMap<>();
        filters.put("targetIssue", "2026068");
        filters.put("riskLevel", "MEDIUM");
        filters.put("candidateCount", "2");
        when(auditEventRepository.findByOrderByGeneratedAtDesc(PageRequest.of(0, 120))).thenReturn(List.of(LotteryAuditEvent.builder()
                .id("audit-1")
                .eventType("LOTTERY_SIMULATION_RUN")
                .filters(filters)
                .generatedAt(150L)
                .build()));

        LotteryOutcomeAttribution result = service.issue("2026068");

        assertThat(result.getIssue()).isEqualTo("2026068");
        assertThat(result.getWinningTicketCount()).isEqualTo(1);
        assertThat(result.getCalibrationState()).isEqualTo("PROMOTE_SIGNAL");
        assertThat(result.getPortfolioContributions()).extracting(LotteryOutcomeAttribution.PortfolioContribution::getContributionState).contains("LINKED");
        assertThat(result.getTicketPackExecutions()).extracting(LotteryOutcomeAttribution.TicketPackExecution::getExecutionState).contains("EXECUTED");
        assertThat(result.getSimulationDrifts()).extracting(LotteryOutcomeAttribution.SimulationDrift::getDriftState).contains("CONFIRMED_SIGNAL");
    }

    @Test
    void recentUsesIssuesFromTicketsAndPacks() {
        when(ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc("default")).thenReturn(List.of(LotteryTicket.builder().issue("2026068").build()));
        when(ticketPackRepository.findByUserIdOrderByUpdatedAtDesc("default", PageRequest.of(0, 100))).thenReturn(List.of());
        when(ticketRepository.findByUserIdAndIssueOrderByCreatedAtDesc("default", "2026068")).thenReturn(List.of());
        when(decisionSetService.outcomeSummary(false, 100)).thenReturn(LotteryDecisionOutcomeSummary.builder().items(List.of()).build());
        when(portfolioService.portfolios(false, 1, 50)).thenReturn(com.one.record.lottery.LotteryPageResponse.<LotteryStrategyPortfolioSummary>builder().items(List.of()).build());
        when(auditEventRepository.findByOrderByGeneratedAtDesc(PageRequest.of(0, 120))).thenReturn(List.of());

        assertThat(service.recent(5)).hasSize(1);
    }
}
