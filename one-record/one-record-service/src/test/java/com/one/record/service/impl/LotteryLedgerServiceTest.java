package com.one.record.service.impl;

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
}
