package com.one.record.service.impl;

import com.one.record.lottery.LotteryIssueLedger;
import com.one.record.lottery.LotteryLedgerSummary;
import com.one.record.lottery.LotteryMonthlyLedger;
import com.one.record.lottery.LotteryPerformanceLedger;
import com.one.record.lottery.LotteryPrizeResult;
import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryPredictionSnapshotRepository;
import com.one.record.repository.LotteryTicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LotteryLedgerServiceTest {

    private LotteryTicketRepository ticketRepository;

    private LotteryPredictionSnapshotRepository predictionSnapshotRepository;

    private LotteryLedgerService service;

    @BeforeEach
    void setUp() {
        ticketRepository = mock(LotteryTicketRepository.class);
        predictionSnapshotRepository = mock(LotteryPredictionSnapshotRepository.class);
        service = new LotteryLedgerService(ticketRepository, predictionSnapshotRepository);
    }

    @Test
    void summaryAggregatesCostPrizeNetAndRoi() {
        when(ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc("default")).thenReturn(List.of(
                LotteryTicket.builder()
                        .cost(new BigDecimal("4"))
                        .prizeResult(LotteryPrizeResult.builder()
                                .prizeAmount(1000L)
                                .winning(true)
                                .build())
                        .build(),
                LotteryTicket.builder()
                        .cost(new BigDecimal("2"))
                        .build()
        ));

        LotteryLedgerSummary summary = service.summary();

        assertThat(summary.getTicketCount()).isEqualTo(2);
        assertThat(summary.getCheckedTicketCount()).isEqualTo(1);
        assertThat(summary.getPendingTicketCount()).isEqualTo(1);
        assertThat(summary.getWinningTicketCount()).isEqualTo(1);
        assertThat(summary.getTotalCost()).isEqualByComparingTo("6");
        assertThat(summary.getTotalPrize()).isEqualByComparingTo("10.00");
        assertThat(summary.getNetResult()).isEqualByComparingTo("4.00");
        assertThat(summary.getRoiPercent()).isEqualByComparingTo("66.67");
        assertThat(summary.getGeneratedAt()).isNotNull();
    }

    @Test
    void issuesGroupTicketsByIssueAndAggregateTotals() {
        when(ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc("default")).thenReturn(List.of(
                LotteryTicket.builder()
                        .issue("2026002")
                        .period(2026002L)
                        .cost(new BigDecimal("2"))
                        .build(),
                LotteryTicket.builder()
                        .issue("2026001")
                        .period(2026001L)
                        .cost(new BigDecimal("4"))
                        .prizeResult(LotteryPrizeResult.builder()
                                .prizeAmount(1000L)
                                .winning(true)
                                .build())
                        .build(),
                LotteryTicket.builder()
                        .issue("2026001")
                        .period(2026001L)
                        .cost(new BigDecimal("2"))
                        .prizeResult(LotteryPrizeResult.builder()
                                .prizeAmount(0L)
                                .winning(false)
                                .build())
                        .build()
        ));

        List<LotteryIssueLedger> issues = service.issues();

        assertThat(issues).hasSize(2);
        assertThat(issues.get(0).getIssue()).isEqualTo("2026002");
        assertThat(issues.get(0).getTicketCount()).isEqualTo(1);
        assertThat(issues.get(0).getPendingTicketCount()).isEqualTo(1);
        assertThat(issues.get(0).getTotalCost()).isEqualByComparingTo("2");
        assertThat(issues.get(0).getNetResult()).isEqualByComparingTo("-2");
        assertThat(issues.get(0).getRoiPercent()).isEqualByComparingTo("-100.00");

        LotteryIssueLedger checkedIssue = issues.get(1);
        assertThat(checkedIssue.getIssue()).isEqualTo("2026001");
        assertThat(checkedIssue.getPeriod()).isEqualTo(2026001L);
        assertThat(checkedIssue.getTicketCount()).isEqualTo(2);
        assertThat(checkedIssue.getCheckedTicketCount()).isEqualTo(2);
        assertThat(checkedIssue.getPendingTicketCount()).isEqualTo(0);
        assertThat(checkedIssue.getWinningTicketCount()).isEqualTo(1);
        assertThat(checkedIssue.getTotalCost()).isEqualByComparingTo("6");
        assertThat(checkedIssue.getTotalPrize()).isEqualByComparingTo("10.00");
        assertThat(checkedIssue.getNetResult()).isEqualByComparingTo("4.00");
        assertThat(checkedIssue.getRoiPercent()).isEqualByComparingTo("66.67");
    }

    @Test
    void monthsGroupTicketsByCreatedMonthDescending() {
        when(ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc("default")).thenReturn(List.of(
                LotteryTicket.builder()
                        .createdAt(timestamp(2026, 7, 3))
                        .cost(new BigDecimal("2"))
                        .prizeResult(LotteryPrizeResult.builder()
                                .prizeAmount(500L)
                                .winning(true)
                                .build())
                        .build(),
                LotteryTicket.builder()
                        .createdAt(timestamp(2026, 6, 29))
                        .cost(new BigDecimal("4"))
                        .build(),
                LotteryTicket.builder()
                        .createdAt(timestamp(2026, 7, 4))
                        .cost(new BigDecimal("2"))
                        .prizeResult(LotteryPrizeResult.builder()
                                .prizeAmount(0L)
                                .winning(false)
                                .build())
                        .build()
        ));

        List<LotteryMonthlyLedger> months = service.months();

        assertThat(months).hasSize(2);
        LotteryMonthlyLedger july = months.get(0);
        assertThat(july.getMonth()).isEqualTo("2026-07");
        assertThat(july.getTicketCount()).isEqualTo(2);
        assertThat(july.getCheckedTicketCount()).isEqualTo(2);
        assertThat(july.getWinningTicketCount()).isEqualTo(1);
        assertThat(july.getTotalCost()).isEqualByComparingTo("4");
        assertThat(july.getTotalPrize()).isEqualByComparingTo("5.00");
        assertThat(july.getNetResult()).isEqualByComparingTo("1.00");
        assertThat(july.getRoiPercent()).isEqualByComparingTo("25.00");

        assertThat(months.get(1).getMonth()).isEqualTo("2026-06");
        assertThat(months.get(1).getPendingTicketCount()).isEqualTo(1);
        assertThat(months.get(1).getNetResult()).isEqualByComparingTo("-4");
    }

    @Test
    void performanceGroupsTicketsBySource() {
        when(ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc("default")).thenReturn(List.of(
                LotteryTicket.builder()
                        .source("manual")
                        .cost(new BigDecimal("2"))
                        .prizeResult(LotteryPrizeResult.builder()
                                .prizeAmount(500L)
                                .winning(true)
                                .build())
                        .build(),
                LotteryTicket.builder()
                        .source("MANUAL")
                        .cost(new BigDecimal("2"))
                        .prizeResult(LotteryPrizeResult.builder()
                                .prizeAmount(0L)
                                .winning(false)
                                .build())
                        .build(),
                LotteryTicket.builder()
                        .source("PREDICTION")
                        .cost(new BigDecimal("4"))
                        .build()
        ));

        List<LotteryPerformanceLedger> performance = service.performance("source");

        assertThat(performance).hasSize(2);
        LotteryPerformanceLedger manual = performance.get(0);
        assertThat(manual.getDimension()).isEqualTo("SOURCE");
        assertThat(manual.getKey()).isEqualTo("MANUAL");
        assertThat(manual.getTicketCount()).isEqualTo(2);
        assertThat(manual.getWinningTicketCount()).isEqualTo(1);
        assertThat(manual.getTotalCost()).isEqualByComparingTo("4");
        assertThat(manual.getTotalPrize()).isEqualByComparingTo("5.00");
        assertThat(manual.getNetResult()).isEqualByComparingTo("1.00");
        assertThat(manual.getRoiPercent()).isEqualByComparingTo("25.00");
        assertThat(manual.getHitRatePercent()).isEqualByComparingTo("50.00");
    }

    @Test
    void performanceGroupsPredictionTicketsByRuleSnapshot() {
        when(ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc("default")).thenReturn(List.of(
                LotteryTicket.builder()
                        .source("PREDICTION")
                        .predictionSnapshotId("snapshot-1")
                        .cost(new BigDecimal("2"))
                        .prizeResult(LotteryPrizeResult.builder()
                                .prizeAmount(500L)
                                .winning(true)
                                .build())
                        .build(),
                LotteryTicket.builder()
                        .source("MANUAL")
                        .cost(new BigDecimal("2"))
                        .build()
        ));
        when(predictionSnapshotRepository.findAllById(List.of("snapshot-1"))).thenReturn(List.of(
                LotteryPredictionSnapshot.builder()
                        .id("snapshot-1")
                        .ruleId("rule-best")
                        .ruleName("最佳规则")
                        .build()
        ));

        List<LotteryPerformanceLedger> performance = service.performance("rule");

        assertThat(performance).hasSize(2);
        assertThat(performance.get(0).getDimension()).isEqualTo("RULE");
        assertThat(performance.get(0).getKey()).isEqualTo("rule-best");
        assertThat(performance.get(0).getName()).isEqualTo("最佳规则");
        assertThat(performance.get(0).getHitRatePercent()).isEqualByComparingTo("100.00");
        assertThat(performance.get(1).getKey()).isEqualTo("MANUAL");
    }

    private long timestamp(int year, int month, int day) {
        return LocalDateTime.of(year, month, day, 12, 0)
                .atZone(ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli();
    }
}
