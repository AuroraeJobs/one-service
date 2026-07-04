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
import com.one.record.service.ILotteryLedgerService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;

@Service
@AllArgsConstructor
public class LotteryLedgerService implements ILotteryLedgerService {

    private static final String DEFAULT_USER_ID = "default";

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    private final LotteryTicketRepository ticketRepository;

    private final LotteryPredictionSnapshotRepository predictionSnapshotRepository;

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

    @Override
    public List<LotteryMonthlyLedger> months() {
        List<LotteryTicket> tickets = ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc(DEFAULT_USER_ID);
        Map<String, List<LotteryTicket>> groupedTickets = new TreeMap<>(Comparator.reverseOrder());
        for (LotteryTicket ticket : tickets) {
            groupedTickets.computeIfAbsent(monthKey(ticket), ignored -> new ArrayList<>()).add(ticket);
        }
        return groupedTickets.entrySet().stream()
                .map(entry -> buildMonthlyLedger(entry.getKey(), entry.getValue()))
                .toList();
    }

    @Override
    public List<LotteryPerformanceLedger> performance(String dimension) {
        String safeDimension = normalizeDimension(dimension);
        List<LotteryTicket> tickets = ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc(DEFAULT_USER_ID);
        Map<String, LotteryPredictionSnapshot> snapshots = "RULE".equals(safeDimension) ? snapshotMap(tickets) : Map.of();
        Map<PerformanceKey, List<LotteryTicket>> groupedTickets = new LinkedHashMap<>();
        for (LotteryTicket ticket : tickets) {
            groupedTickets.computeIfAbsent(performanceKey(safeDimension, ticket, snapshots), ignored -> new ArrayList<>()).add(ticket);
        }
        return groupedTickets.entrySet().stream()
                .map(entry -> buildPerformanceLedger(entry.getKey(), entry.getValue()))
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

    private LotteryPerformanceLedger buildPerformanceLedger(PerformanceKey key, List<LotteryTicket> tickets) {
        LedgerTotals totals = aggregate(tickets);
        return LotteryPerformanceLedger.builder()
                .dimension(key.dimension())
                .key(key.key())
                .name(key.name())
                .ticketCount(tickets.size())
                .checkedTicketCount(totals.checkedCount())
                .pendingTicketCount(tickets.size() - totals.checkedCount())
                .winningTicketCount(totals.winningCount())
                .totalCost(totals.totalCost())
                .totalPrize(totals.totalPrize())
                .netResult(totals.netResult())
                .roiPercent(roiPercent(totals.netResult(), totals.totalCost()))
                .hitRatePercent(hitRatePercent(totals.winningCount(), totals.checkedCount()))
                .build();
    }

    private LotteryMonthlyLedger buildMonthlyLedger(String month, List<LotteryTicket> tickets) {
        LedgerTotals totals = aggregate(tickets);
        return LotteryMonthlyLedger.builder()
                .month(month)
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

    private String monthKey(LotteryTicket ticket) {
        Long timestamp = ticket.getCreatedAt() == null ? ticket.getUpdatedAt() : ticket.getCreatedAt();
        if (timestamp == null || timestamp <= 0) {
            return "UNKNOWN";
        }
        return Instant.ofEpochMilli(timestamp)
                .atZone(ZoneId.systemDefault())
                .format(MONTH_FORMATTER);
    }

    private Map<String, LotteryPredictionSnapshot> snapshotMap(List<LotteryTicket> tickets) {
        List<String> snapshotIds = tickets.stream()
                .map(LotteryTicket::getPredictionSnapshotId)
                .filter(this::hasText)
                .distinct()
                .toList();
        if (snapshotIds.isEmpty()) {
            return Map.of();
        }
        Map<String, LotteryPredictionSnapshot> snapshots = new HashMap<>();
        predictionSnapshotRepository.findAllById(snapshotIds).forEach(snapshot -> snapshots.put(snapshot.getId(), snapshot));
        return snapshots;
    }

    private PerformanceKey performanceKey(
            String dimension,
            LotteryTicket ticket,
            Map<String, LotteryPredictionSnapshot> snapshots
    ) {
        if ("RULE".equals(dimension)) {
            LotteryPredictionSnapshot snapshot = snapshots.get(ticket.getPredictionSnapshotId());
            if (snapshot != null) {
                String ruleId = firstText(snapshot.getRuleId(), snapshot.getId(), "UNKNOWN_RULE");
                String ruleName = firstText(snapshot.getRuleName(), ruleId);
                return new PerformanceKey(dimension, ruleId, ruleName);
            }
            String source = firstText(ticket.getSource(), "UNKNOWN");
            return new PerformanceKey(dimension, source, source);
        }
        String source = firstText(ticket.getSource(), "UNKNOWN").toUpperCase();
        return new PerformanceKey(dimension, source, source);
    }

    private String normalizeDimension(String dimension) {
        if (!hasText(dimension)) {
            return "SOURCE";
        }
        String normalized = dimension.trim().toUpperCase();
        return Objects.equals(normalized, "RULE") ? "RULE" : "SOURCE";
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (hasText(value)) {
                return value.trim();
            }
        }
        return "UNKNOWN";
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
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

    private BigDecimal hitRatePercent(int winningCount, int checkedCount) {
        if (checkedCount == 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(winningCount).multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(checkedCount), 2, RoundingMode.HALF_UP);
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

    private record PerformanceKey(String dimension, String key, String name) {
    }
}
