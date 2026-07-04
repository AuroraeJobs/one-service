package com.one.record.service.impl;

import com.one.record.lottery.LotterySimulationRequest;
import com.one.record.lottery.LotterySimulationResult;
import com.one.record.lottery.LotteryStrategyPortfolioSummary;
import com.one.record.lottery.LotteryTicketBudgetPrecheckRequest;
import com.one.record.lottery.LotteryTicketBudgetPrecheckResult;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryPredictionSnapshotRepository;
import com.one.record.service.ILotterySimulationService;
import com.one.record.service.ILotteryStrategyPortfolioService;
import com.one.record.service.ILotteryTicketService;
import com.one.record.training.LotteryPredictionCandidate;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@AllArgsConstructor
public class LotterySimulationService implements ILotterySimulationService {

    private static final BigDecimal DEFAULT_TICKET_COST = new BigDecimal("2.00");

    private final LotteryPredictionSnapshotRepository predictionSnapshotRepository;

    private final ILotteryTicketService ticketService;

    private final ILotteryStrategyPortfolioService portfolioService;

    private final LotteryAuditEventRepository auditEventRepository;

    @Override
    public LotterySimulationResult simulate(LotterySimulationRequest request) {
        LotterySimulationRequest normalized = request == null ? new LotterySimulationRequest() : request;
        LotteryPredictionSnapshot latest = latestPrediction();
        String targetIssue = resolveTargetIssue(normalized, latest);
        Integer replayWindow = normalizeReplayWindow(normalized.getReplayWindow(), latest);
        List<LotteryTicket> candidateTickets = normalizeTickets(
                normalized.getCandidateTickets() == null || normalized.getCandidateTickets().isEmpty()
                        ? ticketsFromPrediction(latest, targetIssue)
                        : normalized.getCandidateTickets(),
                targetIssue
        );
        LotteryTicketBudgetPrecheckResult budgetPrecheck = ticketService.budgetPrecheck(LotteryTicketBudgetPrecheckRequest.builder()
                .tickets(candidateTickets)
                .build());
        List<LotteryStrategyPortfolioSummary> portfolios = loadPortfolios(normalized.getPortfolioIds());
        List<String> warnings = warnings(normalized, candidateTickets, budgetPrecheck, portfolios, replayWindow);
        BigDecimal proposedCost = candidateTickets.stream()
                .map(ticket -> ticket.getCost() == null ? DEFAULT_TICKET_COST : ticket.getCost())
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal roiReference = roiReference(latest, portfolios);
        String riskLevel = riskLevel(warnings, budgetPrecheck, portfolios);
        LotterySimulationResult result = LotterySimulationResult.builder()
                .targetIssue(targetIssue)
                .candidateCount(candidateTickets.size())
                .proposedCost(proposedCost)
                .budgetLimit(normalized.getBudgetLimit())
                .riskLevel(riskLevel)
                .roiReference(roiReference)
                .replayWindow(replayWindow)
                .budgetPrecheck(budgetPrecheck)
                .candidates(candidateTickets.stream().map(this::candidate).toList())
                .warnings(warnings)
                .hitDistribution(latest == null || latest.getReplaySummary() == null ? Map.of() : latest.getReplaySummary().getCandidateRedHitDistribution())
                .prizeDistribution(latest == null || latest.getReplaySummary() == null ? Map.of() : latest.getReplaySummary().getCandidatePrizeDistribution())
                .portfolios(portfolios)
                .generatedAt(System.currentTimeMillis())
                .build();
        saveAudit(result);
        return result;
    }

    private LotteryPredictionSnapshot latestPrediction() {
        return predictionSnapshotRepository.findByOrderByCreatedAtDesc(PageRequest.of(0, 1))
                .stream()
                .findFirst()
                .orElse(null);
    }

    private String resolveTargetIssue(LotterySimulationRequest request, LotteryPredictionSnapshot latest) {
        if (StringUtils.hasText(request.getTargetIssue())) {
            return request.getTargetIssue().trim();
        }
        if (latest != null && latest.getTargetPeriod() != null) {
            return String.valueOf(latest.getTargetPeriod());
        }
        return null;
    }

    private Integer normalizeReplayWindow(Integer requested, LotteryPredictionSnapshot latest) {
        if (requested != null && requested > 0) {
            return Math.min(500, requested);
        }
        Integer latestWindow = latest == null || latest.getReplaySummary() == null ? null : latest.getReplaySummary().getReplayWindow();
        return latestWindow == null || latestWindow <= 0 ? 30 : latestWindow;
    }

    private List<LotteryTicket> ticketsFromPrediction(LotteryPredictionSnapshot prediction, String targetIssue) {
        if (prediction == null) {
            return List.of();
        }
        List<LotteryTicket> tickets = new ArrayList<>();
        if (prediction.getRedNumbers() != null && prediction.getRedNumbers().size() == 6 && StringUtils.hasText(prediction.getBlueNumber())) {
            tickets.add(ticket(targetIssue, prediction.getRedNumbers(), prediction.getBlueNumber(), "latest-prediction", prediction.getScore(), prediction.getId()));
        }
        for (LotteryPredictionCandidate candidate : prediction.getCandidates() == null ? List.<LotteryPredictionCandidate>of() : prediction.getCandidates()) {
            if (candidate.getRedNumbers() != null && candidate.getRedNumbers().size() == 6 && StringUtils.hasText(candidate.getBlueNumber())) {
                tickets.add(ticket(targetIssue, candidate.getRedNumbers(), candidate.getBlueNumber(), candidate.getTitle(), candidate.getScore(), prediction.getId()));
            }
        }
        return tickets.stream().limit(8).toList();
    }

    private LotteryTicket ticket(String targetIssue, List<String> redNumbers, String blueNumber, String title, Integer score, String snapshotId) {
        return LotteryTicket.builder()
                .issue(targetIssue)
                .redNumbers(new ArrayList<>(redNumbers))
                .blueNumber(blueNumber)
                .quantity(1)
                .cost(DEFAULT_TICKET_COST)
                .source("SIMULATION")
                .status("DRAFT")
                .predictionSnapshotId(snapshotId)
                .note((StringUtils.hasText(title) ? title : "simulation") + (score == null ? "" : " score=" + score))
                .build();
    }

    private List<LotteryTicket> normalizeTickets(List<LotteryTicket> tickets, String targetIssue) {
        return (tickets == null ? List.<LotteryTicket>of() : tickets).stream()
                .filter(Objects::nonNull)
                .map(ticket -> LotteryTicket.builder()
                        .issue(StringUtils.hasText(ticket.getIssue()) ? ticket.getIssue().trim() : targetIssue)
                        .redNumbers(new ArrayList<>(ticket.getRedNumbers() == null ? List.of() : ticket.getRedNumbers()))
                        .blueNumber(ticket.getBlueNumber())
                        .quantity(ticket.getQuantity() == null || ticket.getQuantity() <= 0 ? 1 : ticket.getQuantity())
                        .cost(ticket.getCost() == null || ticket.getCost().compareTo(BigDecimal.ZERO) <= 0 ? DEFAULT_TICKET_COST : ticket.getCost())
                        .source(StringUtils.hasText(ticket.getSource()) ? ticket.getSource() : "SIMULATION")
                        .status(StringUtils.hasText(ticket.getStatus()) ? ticket.getStatus() : "DRAFT")
                        .predictionSnapshotId(ticket.getPredictionSnapshotId())
                        .note(ticket.getNote())
                        .build())
                .filter(ticket -> ticket.getRedNumbers().size() == 6 && StringUtils.hasText(ticket.getBlueNumber()))
                .limit(20)
                .toList();
    }

    private List<LotteryStrategyPortfolioSummary> loadPortfolios(List<String> portfolioIds) {
        return (portfolioIds == null ? List.<String>of() : portfolioIds).stream()
                .filter(StringUtils::hasText)
                .distinct()
                .limit(6)
                .map(id -> {
                    try {
                        return portfolioService.detail(id.trim());
                    } catch (RuntimeException exception) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .toList();
    }

    private LotterySimulationResult.Candidate candidate(LotteryTicket ticket) {
        return LotterySimulationResult.Candidate.builder()
                .key(String.join("-", ticket.getRedNumbers()) + "-" + ticket.getBlueNumber())
                .title(StringUtils.hasText(ticket.getNote()) ? ticket.getNote() : "模拟票")
                .redNumbers(ticket.getRedNumbers())
                .blueNumber(ticket.getBlueNumber())
                .quantity(ticket.getQuantity())
                .cost(ticket.getCost())
                .source(ticket.getSource())
                .warning(ticket.getCost() != null && ticket.getCost().compareTo(new BigDecimal("20")) > 0 ? "单注成本较高" : null)
                .build();
    }

    private List<String> warnings(LotterySimulationRequest request,
                                  List<LotteryTicket> tickets,
                                  LotteryTicketBudgetPrecheckResult budgetPrecheck,
                                  List<LotteryStrategyPortfolioSummary> portfolios,
                                  Integer replayWindow) {
        List<String> warnings = new ArrayList<>();
        if (tickets.isEmpty()) {
            warnings.add("暂无可模拟票据");
        }
        if (request.getBudgetLimit() != null && budgetPrecheck != null && budgetPrecheck.getProposedCost() != null
                && budgetPrecheck.getProposedCost().compareTo(request.getBudgetLimit()) > 0) {
            warnings.add("模拟成本超过沙盘预算");
        }
        if (budgetPrecheck != null && !"OK".equals(budgetPrecheck.getStatus())) {
            warnings.add("预算预检状态：" + budgetPrecheck.getStatus());
        }
        int portfolioWarnings = portfolios.stream().mapToInt(item -> item.getWarningCount() == null ? 0 : item.getWarningCount()).sum();
        if (portfolioWarnings > 0) {
            warnings.add("策略组合存在 " + portfolioWarnings + " 项证据警示");
        }
        if (replayWindow == null || replayWindow < 30) {
            warnings.add("回放窗口偏短");
        }
        return warnings;
    }

    private BigDecimal roiReference(LotteryPredictionSnapshot latest, List<LotteryStrategyPortfolioSummary> portfolios) {
        List<BigDecimal> values = new ArrayList<>();
        portfolios.stream().map(LotteryStrategyPortfolioSummary::getRoiPercent).filter(Objects::nonNull).forEach(values::add);
        if (latest != null && latest.getReplaySummary() != null && latest.getReplaySummary().getRecentAverageScore() != null) {
            values.add(BigDecimal.valueOf(latest.getReplaySummary().getRecentAverageScore()).setScale(2, RoundingMode.HALF_UP));
        }
        if (values.isEmpty()) {
            return null;
        }
        return values.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(new BigDecimal(values.size()), 2, RoundingMode.HALF_UP);
    }

    private String riskLevel(List<String> warnings,
                             LotteryTicketBudgetPrecheckResult budgetPrecheck,
                             List<LotteryStrategyPortfolioSummary> portfolios) {
        if (budgetPrecheck != null && "OVER".equals(budgetPrecheck.getStatus()) || warnings.size() >= 3) {
            return "HIGH";
        }
        boolean portfolioWarning = portfolios.stream().anyMatch(item -> !"PASS".equals(item.getHealthStatus()));
        if (portfolioWarning || !warnings.isEmpty()) {
            return "MEDIUM";
        }
        return "LOW";
    }

    private void saveAudit(LotterySimulationResult result) {
        Map<String, String> filters = new LinkedHashMap<>();
        filters.put("targetIssue", result.getTargetIssue() == null ? "" : result.getTargetIssue());
        filters.put("riskLevel", result.getRiskLevel() == null ? "" : result.getRiskLevel());
        filters.put("candidateCount", String.valueOf(result.getCandidateCount() == null ? 0 : result.getCandidateCount()));
        auditEventRepository.save(LotteryAuditEvent.builder()
                .eventType("LOTTERY_SIMULATION_RUN")
                .targetType("lottery-simulation")
                .targetId(result.getTargetIssue())
                .requesterScope("lottery-simulator")
                .filters(filters)
                .rowCount(result.getCandidateCount())
                .message("Ran lottery what-if simulation")
                .generatedAt(System.currentTimeMillis())
                .build());
    }
}
