package com.one.record.service.impl;

import com.one.record.lottery.LotteryDecisionOutcomeItem;
import com.one.record.lottery.LotteryDecisionOutcomeSummary;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryStrategyPortfolioSummary;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryBacktestReport;
import com.one.record.model.LotteryDecisionSet;
import com.one.record.model.LotteryPredictionRuleRecord;
import com.one.record.model.LotteryStrategyNote;
import com.one.record.model.LotteryStrategyNoteEvidence;
import com.one.record.model.LotteryStrategyPortfolio;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryBacktestReportRepository;
import com.one.record.repository.LotteryDecisionSetRepository;
import com.one.record.repository.LotteryPredictionRuleRepository;
import com.one.record.repository.LotteryStrategyExperimentRepository;
import com.one.record.repository.LotteryStrategyNoteRepository;
import com.one.record.repository.LotteryStrategyPortfolioRepository;
import com.one.record.service.ILotteryDecisionSetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryStrategyPortfolioServiceTest {

    private LotteryStrategyPortfolioRepository repository;

    private LotteryPredictionRuleRepository ruleRepository;

    private LotteryStrategyExperimentRepository experimentRepository;

    private LotteryBacktestReportRepository backtestRepository;

    private LotteryDecisionSetRepository decisionSetRepository;

    private LotteryStrategyNoteRepository noteRepository;

    private ILotteryDecisionSetService decisionSetService;

    private LotteryAuditEventRepository auditEventRepository;

    private LotteryStrategyPortfolioService service;

    @BeforeEach
    void setUp() {
        repository = mock(LotteryStrategyPortfolioRepository.class);
        ruleRepository = mock(LotteryPredictionRuleRepository.class);
        experimentRepository = mock(LotteryStrategyExperimentRepository.class);
        backtestRepository = mock(LotteryBacktestReportRepository.class);
        decisionSetRepository = mock(LotteryDecisionSetRepository.class);
        noteRepository = mock(LotteryStrategyNoteRepository.class);
        decisionSetService = mock(ILotteryDecisionSetService.class);
        auditEventRepository = mock(LotteryAuditEventRepository.class);
        when(repository.save(any(LotteryStrategyPortfolio.class))).thenAnswer(invocation -> {
            LotteryStrategyPortfolio portfolio = invocation.getArgument(0);
            if (portfolio.getId() == null) {
                portfolio.setId("portfolio-1");
            }
            return portfolio;
        });
        when(auditEventRepository.save(any(LotteryAuditEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(decisionSetService.outcomeSummary(false, 100)).thenReturn(LotteryDecisionOutcomeSummary.builder()
                .items(List.of(LotteryDecisionOutcomeItem.builder()
                        .decisionSetId("decision-1")
                        .title("第 2026068 期决策")
                        .roiPercent(new BigDecimal("12.50"))
                        .warningCount(1)
                        .staleEvidenceCount(1)
                        .build()))
                .build());
        service = new LotteryStrategyPortfolioService(repository, ruleRepository, experimentRepository, backtestRepository,
                decisionSetRepository, noteRepository, decisionSetService, auditEventRepository);
    }

    @Test
    void createNormalizesPortfolioAndAggregatesEvidenceSummary() {
        when(ruleRepository.findById("rule-1")).thenReturn(Optional.of(LotteryPredictionRuleRecord.builder()
                .id("rule-1")
                .ruleName("稳态规则")
                .replayCount(60)
                .createdAt(10L)
                .build()));
        when(backtestRepository.findById("backtest-1")).thenReturn(Optional.of(LotteryBacktestReport.builder()
                .id("backtest-1")
                .strategyName("稳态回测")
                .stabilityScore(80)
                .replayCount(30)
                .totalCost(new BigDecimal("100"))
                .netResult(new BigDecimal("10"))
                .createdAt(20L)
                .build()));
        when(decisionSetRepository.findByIdAndUserId("decision-1", "default")).thenReturn(Optional.of(LotteryDecisionSet.builder()
                .id("decision-1")
                .title("决策")
                .updatedAt(30L)
                .build()));
        when(noteRepository.findByIdAndUserId("note-1", "default")).thenReturn(Optional.of(LotteryStrategyNote.builder()
                .id("note-1")
                .title("笔记")
                .evidence(List.of(LotteryStrategyNoteEvidence.builder().evidenceKey("rule-1").build()))
                .updatedAt(40L)
                .build()));

        LotteryStrategyPortfolioSummary summary = service.create(LotteryStrategyPortfolio.builder()
                .name(" 稳态组合 ")
                .allocationWeight(new BigDecimal("2"))
                .evidence(List.of(
                        link("rule", "rule-1"),
                        link("backtest", "backtest-1"),
                        link("decision", "decision-1"),
                        link("note", "note-1")
                ))
                .build());

        assertThat(summary.getPortfolio().getId()).isEqualTo("portfolio-1");
        assertThat(summary.getPortfolio().getName()).isEqualTo("稳态组合");
        assertThat(summary.getRuleCount()).isEqualTo(1);
        assertThat(summary.getBacktestCount()).isEqualTo(1);
        assertThat(summary.getDecisionCount()).isEqualTo(1);
        assertThat(summary.getNoteCount()).isEqualTo(1);
        assertThat(summary.getEvidenceCoveragePercent()).isEqualTo(80);
        assertThat(summary.getRoiPercent()).isEqualByComparingTo("11.25");
        assertThat(summary.getWarningCount()).isGreaterThanOrEqualTo(2);
        assertThat(summary.getEvidence()).extracting("evidenceType").contains("RULE", "BACKTEST", "DECISION", "NOTE");
        verify(auditEventRepository).save(any(LotteryAuditEvent.class));
    }

    @Test
    void portfoliosReturnsSummaryPageAndArchiveWritesAuditEvent() {
        LotteryStrategyPortfolio portfolio = LotteryStrategyPortfolio.builder()
                .id("portfolio-1")
                .userId("default")
                .name("组合")
                .archived(false)
                .evidence(List.of(link("rule", "missing-rule")))
                .createdAt(1L)
                .updatedAt(2L)
                .build();
        when(repository.findByUserIdAndArchivedFalseOrderByUpdatedAtDesc("default", PageRequest.of(0, 20))).thenReturn(List.of(portfolio));
        when(repository.countByUserIdAndArchivedFalse("default")).thenReturn(1L);
        when(repository.findByIdAndUserId("portfolio-1", "default")).thenReturn(Optional.of(portfolio));

        LotteryPageResponse<LotteryStrategyPortfolioSummary> page = service.portfolios(false, 1, 20);
        LotteryStrategyPortfolioSummary archived = service.archive("portfolio-1");

        assertThat(page.getItems()).hasSize(1);
        assertThat(page.getItems().get(0).getRuleCount()).isEqualTo(1);
        assertThat(archived.getPortfolio().getArchived()).isTrue();
        ArgumentCaptor<LotteryAuditEvent> auditCaptor = ArgumentCaptor.forClass(LotteryAuditEvent.class);
        verify(auditEventRepository).save(auditCaptor.capture());
        assertThat(auditCaptor.getValue().getEventType()).isEqualTo("STRATEGY_PORTFOLIO_ARCHIVE");
    }

    private static LotteryStrategyPortfolio.EvidenceLink link(String type, String sourceId) {
        return LotteryStrategyPortfolio.EvidenceLink.builder()
                .evidenceType(type)
                .sourceId(sourceId)
                .allocationWeight(BigDecimal.ONE)
                .build();
    }
}
