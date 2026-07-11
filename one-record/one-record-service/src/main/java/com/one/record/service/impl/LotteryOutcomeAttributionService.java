package com.one.record.service.impl;

import com.one.common.exception.NotFoundException;
import com.one.record.lottery.LotteryDecisionOutcomeItem;
import com.one.record.lottery.LotteryDecisionOutcomeSummary;
import com.one.record.lottery.LotteryOutcomeAttribution;
import com.one.record.lottery.LotteryOutcomeAttributionRollup;
import com.one.record.lottery.LotteryPrizeResult;
import com.one.record.lottery.LotteryStrategyPortfolioSummary;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryTicket;
import com.one.record.model.LotteryTicketPack;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryTicketPackRepository;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.service.ILotteryDecisionSetService;
import com.one.record.service.ILotteryOutcomeAttributionService;
import com.one.record.service.ILotteryStrategyPortfolioService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@AllArgsConstructor
public class LotteryOutcomeAttributionService implements ILotteryOutcomeAttributionService {

    private static final String DEFAULT_USER_ID = "default";

    private final LotteryTicketRepository ticketRepository;

    private final LotteryTicketPackRepository ticketPackRepository;

    private final LotteryAuditEventRepository auditEventRepository;

    private final ILotteryDecisionSetService decisionSetService;

    private final ILotteryStrategyPortfolioService portfolioService;

    @Override
    public List<LotteryOutcomeAttribution> recent(Integer limit) {
        int safeLimit = limit == null || limit <= 0 ? 12 : Math.min(50, limit);
        LinkedHashSet<String> issues = new LinkedHashSet<>();
        ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc(DEFAULT_USER_ID).stream()
                .map(LotteryTicket::getIssue)
                .filter(StringUtils::hasText)
                .forEach(issues::add);
        ticketPackRepository.findByUserIdOrderByUpdatedAtDesc(DEFAULT_USER_ID, PageRequest.of(0, 100)).stream()
                .map(LotteryTicketPack::getTargetIssue)
                .filter(StringUtils::hasText)
                .forEach(issues::add);
        return issues.stream()
                .limit(safeLimit)
                .map(this::issue)
                .toList();
    }

    @Override
    public LotteryOutcomeAttributionRollup rollup(String window, Integer limit) {
        String safeWindow = normalizeWindow(window);
        int safeLimit = rollupLimit(safeWindow, limit);
        List<LotteryOutcomeAttribution> outcomes = recent(safeLimit);
        BigDecimal totalCost = sum(outcomes.stream().map(LotteryOutcomeAttribution::getTotalCost).toList());
        BigDecimal totalPrize = sum(outcomes.stream().map(LotteryOutcomeAttribution::getTotalPrize).toList());
        BigDecimal netResult = totalPrize.subtract(totalCost).setScale(2, RoundingMode.HALF_UP);
        Map<String, Integer> calibrationDistribution = new LinkedHashMap<>();
        Map<String, RollupAccumulator> rows = new LinkedHashMap<>();
        for (LotteryOutcomeAttribution outcome : outcomes) {
            increment(calibrationDistribution, outcome.getCalibrationState());
            addIssueRow(rows, outcome);
            addPortfolioRows(rows, outcome);
            addRuleRows(rows, outcome);
            addTicketPackRows(rows, outcome);
            addSimulatorRows(rows, outcome);
            addRecommendationRows(rows, outcome);
        }
        return LotteryOutcomeAttributionRollup.builder()
                .window(safeWindow)
                .requestedLimit(safeLimit)
                .issueCount(outcomes.size())
                .ticketCount(outcomes.stream().mapToInt(item -> safeInt(item.getTicketCount())).sum())
                .checkedTicketCount(outcomes.stream().mapToInt(item -> safeInt(item.getCheckedTicketCount())).sum())
                .winningTicketCount(outcomes.stream().mapToInt(item -> safeInt(item.getWinningTicketCount())).sum())
                .totalCost(totalCost)
                .totalPrize(totalPrize)
                .netResult(netResult)
                .roiPercent(roiPercent(netResult, totalCost))
                .calibrationDistribution(calibrationDistribution)
                .rows(rows.values().stream()
                        .map(RollupAccumulator::toRow)
                        .sorted(Comparator.comparing(LotteryOutcomeAttributionRollup.RollupRow::getDimension)
                                .thenComparing(LotteryOutcomeAttributionRollup.RollupRow::getSampleCount, Comparator.reverseOrder())
                                .thenComparing(LotteryOutcomeAttributionRollup.RollupRow::getLabel, Comparator.nullsLast(String::compareTo)))
                        .toList())
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    @Override
    public LotteryOutcomeAttribution issue(String issue) {
        if (!StringUtils.hasText(issue)) {
            throw new NotFoundException("彩票归因期号不能为空");
        }
        String safeIssue = issue.trim();
        List<LotteryTicket> tickets = ticketRepository.findByUserIdAndIssueOrderByCreatedAtDesc(DEFAULT_USER_ID, safeIssue);
        List<LotteryTicketPack> packs = ticketPackRepository.findByUserIdOrderByUpdatedAtDesc(DEFAULT_USER_ID, PageRequest.of(0, 100)).stream()
                .filter(pack -> safeIssue.equals(pack.getTargetIssue()))
                .toList();
        LotteryDecisionOutcomeSummary decisionSummary = decisionSetService.outcomeSummary(false, 100);
        List<LotteryDecisionOutcomeItem> decisions = (decisionSummary.getItems() == null ? List.<LotteryDecisionOutcomeItem>of() : decisionSummary.getItems()).stream()
                .filter(item -> safeIssue.equals(item.getTargetIssue()))
                .toList();
        List<LotteryStrategyPortfolioSummary> portfolios = portfolioService.portfolios(false, 1, 50).getItems();
        List<LotteryAuditEvent> simulationEvents = auditEventRepository.findByOrderByGeneratedAtDesc(PageRequest.of(0, 120)).stream()
                .filter(event -> "LOTTERY_SIMULATION_RUN".equals(event.getEventType()))
                .filter(event -> safeIssue.equals(event.getFilters() == null ? null : event.getFilters().get("targetIssue")))
                .toList();
        LotteryOutcomeAttribution result = build(safeIssue, tickets, packs, decisions, portfolios, simulationEvents);
        saveAudit(result);
        return result;
    }

    private LotteryOutcomeAttribution build(String issue,
                                            List<LotteryTicket> tickets,
                                            List<LotteryTicketPack> packs,
                                            List<LotteryDecisionOutcomeItem> decisions,
                                            List<LotteryStrategyPortfolioSummary> portfolios,
                                            List<LotteryAuditEvent> simulationEvents) {
        BigDecimal totalCost = sum(tickets.stream().map(LotteryTicket::getCost).toList());
        BigDecimal totalPrize = sum(tickets.stream()
                .map(LotteryTicket::getPrizeResult)
                .filter(Objects::nonNull)
                .map(LotteryPrizeResult::getPrizeAmount)
                .filter(Objects::nonNull)
                .map(BigDecimal::valueOf)
                .toList());
        BigDecimal netResult = totalPrize.subtract(totalCost);
        Map<String, Integer> prizeDistribution = new LinkedHashMap<>();
        int checked = 0;
        int winning = 0;
        int blueHit = 0;
        int bestRedHits = 0;
        for (LotteryTicket ticket : tickets) {
            LotteryPrizeResult prize = ticket.getPrizeResult();
            if (prize == null) {
                continue;
            }
            checked++;
            if (Boolean.TRUE.equals(prize.getWinning())) {
                winning++;
            }
            if (Boolean.TRUE.equals(prize.getBlueHit())) {
                blueHit++;
            }
            bestRedHits = Math.max(bestRedHits, prize.getRedHits() == null ? 0 : prize.getRedHits());
            increment(prizeDistribution, StringUtils.hasText(prize.getPrizeName()) ? prize.getPrizeName() : value(ticket.getPrizeGrade()));
        }
        final int checkedCount = checked;
        final int winningCount = winning;
        List<LotteryOutcomeAttribution.TimelineItem> timeline = new ArrayList<>();
        packs.forEach(pack -> timeline.add(timeline("TICKET_PACK", pack.getTitle(), "/lottery/ticket-packs", pack.getStatus(), firstTime(pack.getSavedAt(), pack.getUpdatedAt(), pack.getCreatedAt()))));
        decisions.forEach(decision -> timeline.add(timeline("DECISION", decision.getTitle(), "/lottery/predictions/decision", decision.getStatus(), decision.getUpdatedAt())));
        simulationEvents.forEach(event -> timeline.add(timeline("SIMULATION", "沙盘模拟 " + issue, "/lottery/simulator", event.getFilters() == null ? null : event.getFilters().get("riskLevel"), event.getGeneratedAt())));
        tickets.stream().findFirst().ifPresent(ticket -> timeline.add(timeline("TICKET_SETTLEMENT", "票据结算 " + issue, "/lottery/tickets?issue=" + issue, checkedCount > 0 ? "CHECKED" : "PENDING", ticket.getUpdatedAt())));
        timeline.sort(Comparator.comparing(LotteryOutcomeAttribution.TimelineItem::getTimestamp, Comparator.nullsLast(Long::compareTo)).reversed());
        return LotteryOutcomeAttribution.builder()
                .issue(issue)
                .ticketCount(tickets.size())
                .checkedTicketCount(checked)
                .winningTicketCount(winning)
                .totalCost(totalCost)
                .totalPrize(totalPrize)
                .netResult(netResult)
                .roiPercent(roiPercent(netResult, totalCost))
                .bestRedHits(bestRedHits)
                .blueHitCount(blueHit)
                .calibrationState(calibrationState(totalCost, winning, netResult, simulationEvents))
                .prizeDistribution(prizeDistribution)
                .portfolioContributions(portfolioContributions(portfolios, decisions))
                .decisionContributions(decisions.stream().map(this::decisionContribution).toList())
                .ticketPackExecutions(packs.stream().map(this::packExecution).toList())
                .simulationDrifts(simulationEvents.stream().map(event -> simulationDrift(event, winningCount)).toList())
                .timeline(timeline)
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    private List<LotteryOutcomeAttribution.PortfolioContribution> portfolioContributions(List<LotteryStrategyPortfolioSummary> portfolios,
                                                                                        List<LotteryDecisionOutcomeItem> decisions) {
        return portfolios.stream().map(portfolio -> {
            long linkedDecisionCount = portfolio.getEvidence() == null ? 0 : portfolio.getEvidence().stream()
                    .filter(evidence -> "DECISION".equals(evidence.getEvidenceType()))
                    .filter(evidence -> decisions.stream().anyMatch(decision -> Objects.equals(decision.getDecisionSetId(), evidence.getSourceId())))
                    .count();
            return LotteryOutcomeAttribution.PortfolioContribution.builder()
                    .portfolioId(portfolio.getPortfolio() == null ? null : portfolio.getPortfolio().getId())
                    .name(portfolio.getPortfolio() == null ? null : portfolio.getPortfolio().getName())
                    .healthScore(portfolio.getHealthScore())
                    .roiPercent(portfolio.getRoiPercent())
                    .warningCount(portfolio.getWarningCount())
                    .linkedDecisionCount((int) linkedDecisionCount)
                    .contributionState(linkedDecisionCount > 0 ? "LINKED" : "OBSERVE")
                    .build();
        }).toList();
    }

    private LotteryOutcomeAttribution.DecisionContribution decisionContribution(LotteryDecisionOutcomeItem decision) {
        return LotteryOutcomeAttribution.DecisionContribution.builder()
                .decisionSetId(decision.getDecisionSetId())
                .title(decision.getTitle())
                .ruleName(decision.getRuleName())
                .provenance(decision.getProvenance())
                .reviewAction(decision.getReviewAction())
                .reviewBacktestId(decision.getReviewBacktestId())
                .backtestRoiPercentDelta(decision.getBacktestRoiPercentDelta())
                .backtestWarnings(decision.getBacktestWarnings() == null ? List.of() : new ArrayList<>(decision.getBacktestWarnings()))
                .winningCandidateCount(decision.getWinningCandidateCount())
                .netResult(decision.getNetResult())
                .roiPercent(decision.getRoiPercent())
                .contributionState(decision.getWinningCandidateCount() != null && decision.getWinningCandidateCount() > 0 ? "POSITIVE" : "WATCH")
                .build();
    }

    private LotteryOutcomeAttribution.TicketPackExecution packExecution(LotteryTicketPack pack) {
        BigDecimal proposedCost = pack.getBudgetPrecheck() == null ? null : pack.getBudgetPrecheck().getProposedCost();
        return LotteryOutcomeAttribution.TicketPackExecution.builder()
                .packId(pack.getId())
                .title(pack.getTitle())
                .status(pack.getStatus())
                .approvalState(pack.getApprovalState())
                .itemCount(pack.getItems() == null ? 0 : pack.getItems().size())
                .savedTicketCount(pack.getSavedTicketIds() == null ? 0 : pack.getSavedTicketIds().size())
                .proposedCost(proposedCost)
                .executionState("SAVED".equals(pack.getStatus()) ? "EXECUTED" : "PENDING")
                .provenance(pack.getProvenance())
                .sourcePack(pack)
                .build();
    }

    private LotteryOutcomeAttribution.SimulationDrift simulationDrift(LotteryAuditEvent event, int winningTicketCount) {
        String risk = event.getFilters() == null ? null : event.getFilters().get("riskLevel");
        Integer candidateCount = parseInt(event.getFilters() == null ? null : event.getFilters().get("candidateCount"));
        return LotteryOutcomeAttribution.SimulationDrift.builder()
                .auditId(event.getId())
                .targetIssue(event.getFilters() == null ? null : event.getFilters().get("targetIssue"))
                .riskLevel(risk)
                .candidateCount(candidateCount)
                .actualWinningTicketCount(winningTicketCount)
                .driftState(winningTicketCount > 0 ? "CONFIRMED_SIGNAL" : ("HIGH".equals(risk) ? "RISK_AVOIDED_OR_MISSED" : "NO_HIT"))
                .generatedAt(event.getGeneratedAt())
                .build();
    }

    private void saveAudit(LotteryOutcomeAttribution result) {
        Map<String, String> filters = new LinkedHashMap<>();
        filters.put("issue", value(result.getIssue()));
        filters.put("calibrationState", value(result.getCalibrationState()));
        auditEventRepository.save(LotteryAuditEvent.builder()
                .eventType("LOTTERY_OUTCOME_ATTRIBUTION")
                .targetType("lottery-outcome")
                .targetId(result.getIssue())
                .requesterScope("lottery-outcomes")
                .filters(filters)
                .rowCount(result.getTicketCount())
                .message("Generated lottery outcome attribution")
                .generatedAt(System.currentTimeMillis())
                .build());
    }

    private void addIssueRow(Map<String, RollupAccumulator> rows, LotteryOutcomeAttribution outcome) {
        String issue = value(outcome.getIssue());
        row(rows, "issue", issue, issue + " 期", "/lottery/outcomes?issue=" + issue)
                .sample(1)
                .issue(issue)
                .net(outcome.getNetResult())
                .state(outcome.getCalibrationState())
                .warn("WATCH_RISK".equals(outcome.getCalibrationState()) || "RECALIBRATE".equals(outcome.getCalibrationState()));
    }

    private void addPortfolioRows(Map<String, RollupAccumulator> rows, LotteryOutcomeAttribution outcome) {
        for (LotteryOutcomeAttribution.PortfolioContribution portfolio : nullSafe(outcome.getPortfolioContributions())) {
            row(rows, "portfolio", value(firstText(portfolio.getPortfolioId(), portfolio.getName())), value(firstText(portfolio.getName(), portfolio.getPortfolioId())), "/lottery/strategy-portfolios")
                    .sample(safeInt(portfolio.getLinkedDecisionCount()) > 0 ? safeInt(portfolio.getLinkedDecisionCount()) : 1)
                    .issue(outcome.getIssue())
                    .score(portfolio.getHealthScore() == null ? null : BigDecimal.valueOf(portfolio.getHealthScore()))
                    .state(portfolio.getContributionState())
                    .warn(safeInt(portfolio.getWarningCount()));
        }
    }

    private void addRuleRows(Map<String, RollupAccumulator> rows, LotteryOutcomeAttribution outcome) {
        for (LotteryOutcomeAttribution.DecisionContribution decision : nullSafe(outcome.getDecisionContributions())) {
            row(rows, "rule", value(firstText(decision.getRuleName(), decision.getTitle(), decision.getDecisionSetId())), value(firstText(decision.getRuleName(), decision.getTitle(), decision.getDecisionSetId())), "/lottery/predictions/decision")
                    .sample(Math.max(1, safeInt(decision.getWinningCandidateCount())))
                    .issue(outcome.getIssue())
                    .net(decision.getNetResult())
                    .score(decision.getRoiPercent())
                    .state(decision.getContributionState())
                    .warn("WATCH".equals(decision.getContributionState()));
        }
    }

    private void addTicketPackRows(Map<String, RollupAccumulator> rows, LotteryOutcomeAttribution outcome) {
        for (LotteryOutcomeAttribution.TicketPackExecution pack : nullSafe(outcome.getTicketPackExecutions())) {
            boolean hasGap = safeInt(pack.getSavedTicketCount()) < safeInt(pack.getItemCount());
            row(rows, "source", value(firstText(pack.getPackId(), pack.getTitle(), pack.getExecutionState())), value(firstText(pack.getTitle(), pack.getPackId(), pack.getExecutionState())), "/lottery/ticket-packs")
                    .sample(Math.max(1, safeInt(pack.getItemCount())))
                    .issue(outcome.getIssue())
                    .net(pack.getProposedCost() == null ? null : pack.getProposedCost().negate())
                    .state(pack.getExecutionState())
                    .warn(hasGap);
            row(rows, "ticket-pack-execution", value(pack.getExecutionState()), value(pack.getExecutionState()), "/lottery/ticket-packs")
                    .sample(1)
                    .issue(outcome.getIssue())
                    .state(pack.getExecutionState())
                    .warn(hasGap);
        }
    }

    private void addSimulatorRows(Map<String, RollupAccumulator> rows, LotteryOutcomeAttribution outcome) {
        for (LotteryOutcomeAttribution.SimulationDrift drift : nullSafe(outcome.getSimulationDrifts())) {
            row(rows, "simulator-risk", value(drift.getRiskLevel()), value(drift.getRiskLevel()), "/lottery/simulator")
                    .sample(Math.max(1, safeInt(drift.getCandidateCount())))
                    .issue(outcome.getIssue())
                    .state(drift.getDriftState())
                    .warn("WATCH_RISK".equals(drift.getDriftState()) || "RECALIBRATE".equals(drift.getDriftState()));
        }
    }

    private void addRecommendationRows(Map<String, RollupAccumulator> rows, LotteryOutcomeAttribution outcome) {
        for (LotteryOutcomeAttribution.TimelineItem item : nullSafe(outcome.getTimeline())) {
            if (!isRecommendationTimeline(item)) {
                continue;
            }
            row(rows, "recommendation-lifecycle", value(item.getState()), value(item.getState()), StringUtils.hasText(item.getPath()) ? item.getPath() : "/lottery/recommendations")
                    .sample(1)
                    .issue(outcome.getIssue())
                    .state(item.getState())
                    .warn("WATCH".equals(item.getState()) || "PAUSE".equals(item.getState()) || "RETIRE".equals(item.getState()));
        }
    }

    private BigDecimal sum(List<BigDecimal> values) {
        return values.stream().filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal roiPercent(BigDecimal netResult, BigDecimal totalCost) {
        if (totalCost == null || totalCost.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return netResult.multiply(new BigDecimal("100")).divide(totalCost, 2, RoundingMode.HALF_UP);
    }

    private String calibrationState(BigDecimal totalCost, int winning, BigDecimal netResult, List<LotteryAuditEvent> simulations) {
        if (totalCost == null || totalCost.compareTo(BigDecimal.ZERO) == 0) {
            return "NO_EXECUTION";
        }
        if (winning > 0 || netResult.compareTo(BigDecimal.ZERO) > 0) {
            return "PROMOTE_SIGNAL";
        }
        if (simulations.stream().anyMatch(event -> "HIGH".equals(event.getFilters() == null ? null : event.getFilters().get("riskLevel")))) {
            return "WATCH_RISK";
        }
        return "RECALIBRATE";
    }

    private LotteryOutcomeAttribution.TimelineItem timeline(String type, String title, String path, String state, Long timestamp) {
        return LotteryOutcomeAttribution.TimelineItem.builder()
                .type(type)
                .title(title)
                .path(path)
                .state(state)
                .timestamp(timestamp)
                .build();
    }

    private Long firstTime(Long... values) {
        for (Long value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private void increment(Map<String, Integer> distribution, String key) {
        distribution.put(value(key), distribution.getOrDefault(value(key), 0) + 1);
    }

    private RollupAccumulator row(Map<String, RollupAccumulator> rows, String dimension, String key, String label, String path) {
        String safeKey = value(key);
        return rows.computeIfAbsent(dimension + ":" + safeKey, ignored -> new RollupAccumulator(dimension, safeKey, value(label), path));
    }

    private String normalizeWindow(String window) {
        String safeWindow = StringUtils.hasText(window) ? window.trim().toLowerCase() : "recent10";
        return switch (safeWindow) {
            case "latest", "recent10", "month-to-date", "all" -> safeWindow;
            default -> "recent10";
        };
    }

    private int rollupLimit(String window, Integer limit) {
        if ("latest".equals(window)) {
            return 1;
        }
        if ("recent10".equals(window)) {
            return 10;
        }
        if ("month-to-date".equals(window)) {
            return 31;
        }
        return limit == null || limit <= 0 ? 50 : Math.min(50, limit);
    }

    private boolean isRecommendationTimeline(LotteryOutcomeAttribution.TimelineItem item) {
        String text = (value(item.getType()) + " " + value(item.getTitle())).toUpperCase();
        return text.contains("RECOMMEND") || text.contains("推荐");
    }

    private <T> List<T> nullSafe(List<T> values) {
        return values == null ? List.of() : values;
    }

    private String firstText(String... values) {
        for (String item : values) {
            if (StringUtils.hasText(item)) {
                return item;
            }
        }
        return null;
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private Integer parseInt(String value) {
        try {
            return StringUtils.hasText(value) ? Integer.parseInt(value) : null;
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String value(String value) {
        return StringUtils.hasText(value) ? value : "-";
    }

    private static class RollupAccumulator {

        private final String dimension;

        private final String key;

        private final String label;

        private final String path;

        private final LinkedHashSet<String> issues = new LinkedHashSet<>();

        private int sampleCount;

        private int warningCount;

        private BigDecimal netResult = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        private BigDecimal scoreTotal = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        private int scoreCount;

        private String state;

        RollupAccumulator(String dimension, String key, String label, String path) {
            this.dimension = dimension;
            this.key = key;
            this.label = label;
            this.path = path;
        }

        RollupAccumulator issue(String issue) {
            if (StringUtils.hasText(issue)) {
                issues.add(issue);
            }
            return this;
        }

        RollupAccumulator sample(int value) {
            sampleCount += Math.max(0, value);
            return this;
        }

        RollupAccumulator warn(boolean value) {
            if (value) {
                warningCount++;
            }
            return this;
        }

        RollupAccumulator warn(int value) {
            warningCount += Math.max(0, value);
            return this;
        }

        RollupAccumulator net(BigDecimal value) {
            if (value != null) {
                netResult = netResult.add(value).setScale(2, RoundingMode.HALF_UP);
            }
            return this;
        }

        RollupAccumulator score(BigDecimal value) {
            if (value != null) {
                scoreTotal = scoreTotal.add(value).setScale(2, RoundingMode.HALF_UP);
                scoreCount++;
            }
            return this;
        }

        RollupAccumulator state(String value) {
            if (StringUtils.hasText(value)) {
                state = value;
            }
            return this;
        }

        LotteryOutcomeAttributionRollup.RollupRow toRow() {
            BigDecimal averageScore = scoreCount == 0 ? null : scoreTotal.divide(BigDecimal.valueOf(scoreCount), 2, RoundingMode.HALF_UP);
            return LotteryOutcomeAttributionRollup.RollupRow.builder()
                    .dimension(dimension)
                    .key(key)
                    .label(label)
                    .issueCount(issues.size())
                    .sampleCount(sampleCount)
                    .warningCount(warningCount)
                    .netResult(netResult)
                    .roiPercent(averageScore)
                    .state(state)
                    .evidenceQuality(quality(sampleCount, warningCount, averageScore))
                    .path(path)
                    .build();
        }

        private String quality(int samples, int warnings, BigDecimal score) {
            if (samples <= 0) {
                return "UNDER_TESTED";
            }
            if (warnings > 0) {
                return "WATCH";
            }
            if (score != null && score.compareTo(BigDecimal.ZERO) < 0) {
                return "NEGATIVE";
            }
            if (samples >= 3 || (score != null && score.compareTo(new BigDecimal("80")) >= 0)) {
                return "STABLE";
            }
            return "OBSERVE";
        }
    }
}
