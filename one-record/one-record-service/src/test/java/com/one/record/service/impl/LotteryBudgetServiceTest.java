package com.one.record.service.impl;

import com.one.record.lottery.LotteryBudgetStatus;
import com.one.record.model.LotteryPreference;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.service.ILotteryPreferenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LotteryBudgetServiceTest {

    private LotteryTicketRepository ticketRepository;

    private ILotteryPreferenceService preferenceService;

    private LotteryBudgetService service;

    @BeforeEach
    void setUp() {
        ticketRepository = mock(LotteryTicketRepository.class);
        preferenceService = mock(ILotteryPreferenceService.class);
        service = new LotteryBudgetService(ticketRepository, preferenceService);
    }

    @Test
    void statusWarnsForBudgetThresholdsAndIssueExposure() {
        when(preferenceService.preference()).thenReturn(LotteryPreference.builder()
                .weeklyBudget(new BigDecimal("10"))
                .monthlyBudget(new BigDecimal("40"))
                .maxTicketsPerIssue(2)
                .budgetReminderPercent(80)
                .build());
        when(ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc("default")).thenReturn(List.of(
                ticket("2026079", 2, "6"),
                ticket("2026079", 1, "4"),
                ticket("2026078", 1, "2")
        ));

        LotteryBudgetStatus status = service.status();

        assertThat(status.getStatus()).isEqualTo("WARNING");
        assertThat(status.getWeeklyCost()).isEqualByComparingTo("12");
        assertThat(status.getMonthlyCost()).isEqualByComparingTo("12");
        assertThat(status.getWeeklyUsagePercent()).isEqualByComparingTo("120.00");
        assertThat(status.getMaxIssue()).isEqualTo("2026079");
        assertThat(status.getMaxIssueTicketCount()).isEqualTo(3);
        assertThat(status.getWarnings()).extracting("key")
                .contains("weekly-budget", "max-tickets-per-issue");
    }

    @Test
    void statusIsOkWhenNoThresholdsAreConfigured() {
        when(preferenceService.preference()).thenReturn(LotteryPreference.builder()
                .budgetReminderPercent(80)
                .build());
        when(ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc("default")).thenReturn(List.of(ticket("2026079", 1, "2")));

        LotteryBudgetStatus status = service.status();

        assertThat(status.getStatus()).isEqualTo("OK");
        assertThat(status.getWarnings()).isEmpty();
    }

    private LotteryTicket ticket(String issue, int quantity, String cost) {
        return LotteryTicket.builder()
                .issue(issue)
                .quantity(quantity)
                .cost(new BigDecimal(cost))
                .createdAt(LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli())
                .build();
    }
}
