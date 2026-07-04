package com.one.record.service.impl;

import com.one.record.lottery.LotteryIssueLedger;
import com.one.record.lottery.LotteryLedgerSummary;
import com.one.record.lottery.LotteryPrizeResult;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.service.ILotteryLedgerService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
public class LotteryLedgerService implements ILotteryLedgerService {

    private static final String DEFAULT_USER_ID = "default";

    private final LotteryTicketRepository ticketRepository;

    @Override
    public LotteryLedgerSummary summary() {
        List<LotteryTicket> tickets = ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc(DEFAULT_USER_ID);
        LedgerTotals totals = aggregate(tickets);
        return LotteryLedgerSummary.builder()
                .ticketCount(tickets.size())
                .checkedTicketCount(totals.checkedCount())
                .pendingTicketCount(tickets.size() - totals.checkedCount())
                .winningTicketCount(totals.winningCount())
                .totalCost(totals.totalCost())
                .totalPrize(totals.totalPrize())
                .netResult(totals.netResult())
                .roiPercent(roiPercent(totals.netResult(), totals.totalCost()))
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    @Override
    public List<LotteryIssueLedger> issues() {
        List<LotteryTicket> tickets = ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc(DEFAULT_USER_ID);
        Map<String, List<LotteryTicket>> groupedTickets = new LinkedHashMap<>();
        for (LotteryTicket ticket : tickets) {
            groupedTickets.computeIfAbsent(issueKey(ticket), ignored -> new ArrayList<>()).add(ticket);
        }
        return groupedTickets.values().stream()
                .map(this::buildIssueLedger)
                .toList();
    }

    private LotteryIssueLedger buildIssueLedger(List<LotteryTicket> tickets) {
        LotteryTicket firstTicket = tickets.get(0);
        LedgerTotals totals = aggregate(tickets);
        return LotteryIssueLedger.builder()
                .issue(firstTicket.getIssue())
                .period(firstTicket.getPeriod())
                .ticketCount(tickets.size())
                .checkedTicketCount(totals.checkedCount())
                .pendingTicketCount(tickets.size() - totals.checkedCount())
                .winningTicketCount(totals.winningCount())
                .totalCost(totals.totalCost())
                .totalPrize(totals.totalPrize())
                .netResult(totals.netResult())
                .roiPercent(roiPercent(totals.netResult(), totals.totalCost()))
                .build();
    }

    private LedgerTotals aggregate(List<LotteryTicket> tickets) {
        int checkedCount = 0;
        int winningCount = 0;
        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalPrize = BigDecimal.ZERO;
        for (LotteryTicket ticket : tickets) {
            totalCost = totalCost.add(ticket.getCost() == null ? BigDecimal.ZERO : ticket.getCost());
            LotteryPrizeResult result = ticket.getPrizeResult();
            if (result != null) {
                checkedCount += 1;
                totalPrize = totalPrize.add(prizeAmount(result));
                if (Boolean.TRUE.equals(result.getWinning())) {
                    winningCount += 1;
                }
            }
        }
        return new LedgerTotals(checkedCount, winningCount, totalCost, totalPrize);
    }

    private String issueKey(LotteryTicket ticket) {
        if (ticket.getIssue() != null && !ticket.getIssue().isBlank()) {
            return ticket.getIssue();
        }
        if (ticket.getPeriod() != null) {
            return String.valueOf(ticket.getPeriod());
        }
        return "UNKNOWN";
    }

    private BigDecimal prizeAmount(LotteryPrizeResult result) {
        if (result.getPrizeAmount() == null) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(result.getPrizeAmount()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal roiPercent(BigDecimal netResult, BigDecimal totalCost) {
        if (totalCost.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return netResult.multiply(BigDecimal.valueOf(100)).divide(totalCost, 2, RoundingMode.HALF_UP);
    }

    private record LedgerTotals(
            int checkedCount,
            int winningCount,
            BigDecimal totalCost,
            BigDecimal totalPrize
    ) {

        private BigDecimal netResult() {
            return totalPrize.subtract(totalCost);
        }
    }
}
