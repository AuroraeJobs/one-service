package com.one.record.service.impl;

import com.one.record.lottery.LotteryBudgetStatus;
import com.one.record.model.LotteryPreference;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.service.ILotteryBudgetService;
import com.one.record.service.ILotteryPreferenceService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
public class LotteryBudgetService implements ILotteryBudgetService {

    private static final String DEFAULT_USER_ID = "default";

    private final LotteryTicketRepository ticketRepository;

    private final ILotteryPreferenceService preferenceService;

    @Override
    public LotteryBudgetStatus status() {
        LotteryPreference preference = preferenceService.preference();
        List<LotteryTicket> tickets = ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc(DEFAULT_USER_ID);
        long now = System.currentTimeMillis();
        LocalDate today = Instant.ofEpochMilli(now).atZone(ZoneId.systemDefault()).toLocalDate();
        long weekStart = today.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY))
                .atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
        long monthStart = today.withDayOfMonth(1).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
        BigDecimal weeklyCost = costSince(tickets, weekStart);
        BigDecimal monthlyCost = costSince(tickets, monthStart);
        IssueExposure exposure = maxIssueExposure(tickets);
        List<LotteryBudgetStatus.Warning> warnings = warnings(preference, weeklyCost, monthlyCost, exposure);
        return LotteryBudgetStatus.builder()
                .weeklyBudget(preference.getWeeklyBudget())
                .monthlyBudget(preference.getMonthlyBudget())
                .maxTicketsPerIssue(preference.getMaxTicketsPerIssue())
                .budgetReminderPercent(preference.getBudgetReminderPercent())
                .weeklyCost(weeklyCost)
                .monthlyCost(monthlyCost)
                .maxIssueTicketCount(exposure.ticketCount())
                .maxIssue(exposure.issue())
                .weeklyUsagePercent(percent(weeklyCost, preference.getWeeklyBudget()))
                .monthlyUsagePercent(percent(monthlyCost, preference.getMonthlyBudget()))
                .status(warnings.isEmpty() ? "OK" : "WARNING")
                .warnings(warnings)
                .generatedAt(now)
                .build();
    }

    private List<LotteryBudgetStatus.Warning> warnings(LotteryPreference preference,
                                                       BigDecimal weeklyCost,
                                                       BigDecimal monthlyCost,
                                                       IssueExposure exposure) {
        List<LotteryBudgetStatus.Warning> warnings = new ArrayList<>();
        addBudgetWarning(warnings, "weekly-budget", "本周投入接近或超过预算", weeklyCost, preference.getWeeklyBudget(), preference.getBudgetReminderPercent());
        addBudgetWarning(warnings, "monthly-budget", "本月投入接近或超过预算", monthlyCost, preference.getMonthlyBudget(), preference.getBudgetReminderPercent());
        Integer maxTickets = preference.getMaxTicketsPerIssue();
        if (maxTickets != null && exposure.ticketCount() > maxTickets) {
            warnings.add(LotteryBudgetStatus.Warning.builder()
                    .key("max-tickets-per-issue")
                    .level("WARNING")
                    .message("第 " + exposure.issue() + " 期票据数量超过上限 " + maxTickets)
                    .path("/lottery/tickets?issue=" + exposure.issue())
                    .build());
        }
        return warnings;
    }

    private void addBudgetWarning(List<LotteryBudgetStatus.Warning> warnings,
                                  String key,
                                  String message,
                                  BigDecimal cost,
                                  BigDecimal budget,
                                  Integer thresholdPercent) {
        if (budget == null || budget.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        BigDecimal usage = percent(cost, budget);
        int threshold = thresholdPercent == null ? 80 : thresholdPercent;
        if (usage.compareTo(BigDecimal.valueOf(threshold)) >= 0) {
            warnings.add(LotteryBudgetStatus.Warning.builder()
                    .key(key)
                    .level(usage.compareTo(BigDecimal.valueOf(100)) >= 0 ? "OVER" : "WARNING")
                    .message(message + "（" + usage + "%）")
                    .path("/lottery/ledger")
                    .build());
        }
    }

    private BigDecimal costSince(List<LotteryTicket> tickets, long startAt) {
        return tickets.stream()
                .filter(ticket -> timestamp(ticket) >= startAt)
                .map(this::cost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private IssueExposure maxIssueExposure(List<LotteryTicket> tickets) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (LotteryTicket ticket : tickets) {
            String issue = issueKey(ticket);
            counts.put(issue, counts.getOrDefault(issue, 0) + safe(ticket.getQuantity()));
        }
        return counts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(entry -> new IssueExposure(entry.getKey(), entry.getValue()))
                .orElse(new IssueExposure(null, 0));
    }

    private BigDecimal percent(BigDecimal value, BigDecimal base) {
        if (base == null || base.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return value.multiply(BigDecimal.valueOf(100)).divide(base, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal cost(LotteryTicket ticket) {
        return ticket.getCost() == null ? BigDecimal.ZERO : ticket.getCost();
    }

    private int safe(Integer value) {
        return value == null ? 1 : Math.max(0, value);
    }

    private long timestamp(LotteryTicket ticket) {
        Long timestamp = ticket.getCreatedAt() == null ? ticket.getUpdatedAt() : ticket.getCreatedAt();
        return timestamp == null ? 0 : timestamp;
    }

    private String issueKey(LotteryTicket ticket) {
        if (ticket.getIssue() != null && !ticket.getIssue().isBlank()) {
            return ticket.getIssue();
        }
        return ticket.getPeriod() == null ? "UNKNOWN" : String.valueOf(ticket.getPeriod());
    }

    private record IssueExposure(String issue, int ticketCount) {
    }
}
