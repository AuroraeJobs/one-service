package com.one.record.service.impl;

import com.one.record.lottery.LotteryIssueLedger;
import com.one.record.lottery.LotteryLedgerSummary;
import com.one.record.lottery.LotteryPrizeResult;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryTicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LotteryLedgerServiceTest {

    private LotteryTicketRepository ticketRepository;

    private LotteryLedgerService service;

    @BeforeEach
    void setUp() {
        ticketRepository = mock(LotteryTicketRepository.class);
        service = new LotteryLedgerService(ticketRepository);
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
}
