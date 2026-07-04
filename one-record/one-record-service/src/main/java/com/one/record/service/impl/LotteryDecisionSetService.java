package com.one.record.service.impl;

import com.one.record.lottery.LotteryAuditMetadata;
import com.one.record.lottery.LotteryDecisionCandidateOutcome;
import com.one.record.lottery.LotteryDecisionOutcomeItem;
import com.one.record.lottery.LotteryDecisionOutcomeSummary;
import com.one.record.lottery.LotteryDecisionPerformanceDelta;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryPerformanceLedger;
import com.one.record.lottery.LotteryPrizeResult;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryDecisionCandidateSelection;
import com.one.record.model.LotteryDecisionSet;
import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryDecisionSetRepository;
import com.one.record.repository.LotteryPredictionSnapshotRepository;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.service.ILotteryDecisionSetService;
import com.one.record.service.ILotteryLedgerService;
import com.one.record.training.LotteryActualRecord;
import com.one.record.util.LotteryDrawUtil;
import com.one.record.util.LotteryPrizeCalculator;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@AllArgsConstructor
public class LotteryDecisionSetService implements ILotteryDecisionSetService {

    private static final String DEFAULT_USER_ID = "default";

    private static final String REQUESTER_SCOPE = "default";

    private static final int DEFAULT_PAGE = 1;

    private static final int DEFAULT_PAGE_SIZE = 20;

    private static final int MAX_PAGE_SIZE = 100;

    private static final int MAX_CANDIDATES = 100;

    private final LotteryDecisionSetRepository repository;

    private final LotteryAuditEventRepository auditEventRepository;

    private final LotteryTicketRepository ticketRepository;

    private final LotteryPredictionSnapshotRepository predictionSnapshotRepository;

    private final ILotteryLedgerService ledgerService;

    @Override
    public LotteryPageResponse<LotteryDecisionSet> decisionSets(Boolean includeArchived, Integer page, Integer pageSize) {
        int currentPage = normalizePage(page);
        int currentPageSize = normalizePageSize(pageSize);
        boolean withArchived = Boolean.TRUE.equals(includeArchived);
        PageRequest pageRequest = PageRequest.of(currentPage - 1, currentPageSize);
        long total = withArchived ? repository.countByUserId(DEFAULT_USER_ID) : repository.countByUserIdAndArchivedFalse(DEFAULT_USER_ID);
        List<LotteryDecisionSet> items = withArchived
                ? repository.findByUserIdOrderByUpdatedAtDesc(DEFAULT_USER_ID, pageRequest)
                : repository.findByUserIdAndArchivedFalseOrderByUpdatedAtDesc(DEFAULT_USER_ID, pageRequest);
        return LotteryPageResponse.<LotteryDecisionSet>builder()
                .items(items)
                .page(currentPage)
                .pageSize(currentPageSize)
                .total(total)
                .hasNext((long) currentPage * currentPageSize < total)
                .build();
    }

    @Override
    public LotteryDecisionOutcomeSummary outcomeSummary(Boolean includeArchived, Integer limit) {
        List<LotteryDecisionSet> sets = decisionSets(includeArchived, 1, limit).getItems();
        Map<String, LotteryPredictionSnapshot> snapshots = snapshotMap(sets);
        List<LotteryTicket> tickets = ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc(DEFAULT_USER_ID);
        Map<String, LotteryPerformanceLedger> ruleBenchmarks = performanceMap(ledgerService.performance("RULE"));
        Map<String, LotteryPerformanceLedger> sourceBenchmarks = performanceMap(ledgerService.performance("SOURCE"));
        List<LotteryDecisionOutcomeItem> items = sets.stream()
                .map(set -> buildOutcomeItem(set, snapshots, tickets, ruleBenchmarks, sourceBenchmarks))
                .toList();
        return summarizeOutcomes(items);
    }

    @Override
    public LotteryDecisionSet createDecisionSet(LotteryDecisionSet decisionSet) {
        long now = System.currentTimeMillis();
        LotteryDecisionSet target = new LotteryDecisionSet();
        applyMutableFields(target, decisionSet);
        target.setUserId(DEFAULT_USER_ID);
        target.setStatus("ACTIVE");
        target.setArchived(false);
        target.setArchivedAt(null);
        target.setCreatedAt(now);
        target.setUpdatedAt(now);
        target.setAuditMetadata(audit("decision-set-create", now, now));
        LotteryDecisionSet saved = repository.save(target);
        saveAuditEvent("DECISION_SET_CREATE", saved, "Created lottery decision set");
        return saved;
    }

    @Override
    public LotteryDecisionSet updateDecisionSet(String id, LotteryDecisionSet decisionSet) {
        LotteryDecisionSet target = loadOwnedDecisionSet(id);
        long now = System.currentTimeMillis();
        applyMutableFields(target, decisionSet);
        target.setUpdatedAt(now);
        target.setAuditMetadata(audit("decision-set-update", createdAt(target, now), now));
        LotteryDecisionSet saved = repository.save(target);
        saveAuditEvent("DECISION_SET_UPDATE", saved, "Updated lottery decision set");
        return saved;
    }

    @Override
    public LotteryDecisionSet archiveDecisionSet(String id) {
        LotteryDecisionSet target = loadOwnedDecisionSet(id);
        long now = System.currentTimeMillis();
        target.setStatus("ARCHIVED");
        target.setArchived(true);
        target.setArchivedAt(now);
        target.setUpdatedAt(now);
        target.setAuditMetadata(audit("decision-set-archive", createdAt(target, now), now));
        LotteryDecisionSet saved = repository.save(target);
        saveAuditEvent("DECISION_SET_ARCHIVE", saved, "Archived lottery decision set");
        return saved;
    }

    private LotteryDecisionOutcomeItem buildOutcomeItem(LotteryDecisionSet decisionSet,
                                                       Map<String, LotteryPredictionSnapshot> snapshots,
                                                       List<LotteryTicket> tickets,
                                                       Map<String, LotteryPerformanceLedger> ruleBenchmarks,
                                                       Map<String, LotteryPerformanceLedger> sourceBenchmarks) {
        List<LotteryDecisionCandidateOutcome> candidates = (decisionSet.getSelectedCandidates() == null
                ? List.<LotteryDecisionCandidateSelection>of()
                : decisionSet.getSelectedCandidates())
                .stream()
                .map(candidate -> buildCandidateOutcome(decisionSet, candidate, snapshots, tickets))
                .toList();
        BigDecimal totalCost = sumMoney(candidates.stream().map(LotteryDecisionCandidateOutcome::getTotalCost).toList());
        BigDecimal totalPrize = sumMoney(candidates.stream().map(LotteryDecisionCandidateOutcome::getTotalPrize).toList());
        BigDecimal netResult = totalPrize.subtract(totalCost);
        int checkedTickets = candidates.stream().mapToInt(item -> safeInt(item.getCheckedTicketCount())).sum();
        int winningTickets = candidates.stream().mapToInt(item -> safeInt(item.getWinningTicketCount())).sum();
        Map<String, Integer> hitDistribution = new LinkedHashMap<>();
        Map<String, Integer> prizeDistribution = new LinkedHashMap<>();
        Set<String> evidenceAlerts = new LinkedHashSet<>();
        for (LotteryDecisionCandidateOutcome candidate : candidates) {
            if (candidate.getRedHits() != null) {
                increment(hitDistribution, candidate.getRedHits() + "红");
            }
            if (StringUtils.hasText(candidate.getPrizeName())) {
                increment(prizeDistribution, candidate.getPrizeName());
            }
            if (candidate.getWarnings() != null) {
                evidenceAlerts.addAll(candidate.getWarnings());
            }
        }
        String ruleName = firstText(decisionSet.getRuleName(), firstCandidateRule(decisionSet));
        LotteryDecisionOutcomeItem item = LotteryDecisionOutcomeItem.builder()
                .decisionSetId(decisionSet.getId())
                .title(decisionSet.getTitle())
                .targetIssue(decisionSet.getTargetIssue())
                .ruleName(ruleName)
                .conversionState(decisionSet.getConversionState())
                .status(decisionSet.getStatus())
                .candidateCount(candidates.size())
                .scoredCandidateCount((int) candidates.stream().filter(candidate -> candidate.getRedHits() != null).count())
                .winningCandidateCount((int) candidates.stream().filter(candidate -> "WON".equals(candidate.getResultState())).count())
                .convertedTicketCount(candidates.stream().mapToInt(itemCandidate -> safeInt(itemCandidate.getConvertedTicketCount())).sum())
                .checkedConvertedTicketCount(checkedTickets)
                .winningConvertedTicketCount(winningTickets)
                .totalCost(totalCost)
                .totalPrize(totalPrize)
                .netResult(netResult)
                .roiPercent(roiPercent(netResult, totalCost))
                .hitRatePercent(hitRatePercent(winningTickets, checkedTickets))
                .bestRedHits(candidates.stream()
                        .map(LotteryDecisionCandidateOutcome::getRedHits)
                        .filter(Objects::nonNull)
                        .max(Integer::compareTo)
                        .orElse(null))
                .blueHitCount((int) candidates.stream().filter(candidate -> Boolean.TRUE.equals(candidate.getBlueHit())).count())
                .warningCount((int) candidates.stream().filter(candidate -> candidate.getWarnings() != null && !candidate.getWarnings().isEmpty()).count())
                .staleEvidenceCount((int) candidates.stream().filter(candidate -> "STALE".equals(candidate.getEvidenceTag())).count())
                .volatileEvidenceCount((int) candidates.stream().filter(candidate -> "VOLATILE".equals(candidate.getEvidenceTag())).count())
                .underTestedEvidenceCount((int) candidates.stream().filter(candidate -> "UNDER_TESTED".equals(candidate.getEvidenceTag())).count())
                .hitDistribution(hitDistribution)
                .prizeDistribution(prizeDistribution)
                .evidenceAlerts(new ArrayList<>(evidenceAlerts))
                .candidates(candidates)
                .createdAt(decisionSet.getCreatedAt())
                .updatedAt(decisionSet.getUpdatedAt())
                .build();
        item.setRuleDelta(performanceDelta("RULE", ruleName, item, ruleBenchmarks.get(performanceKey(ruleName))));
        item.setSourceDelta(performanceDelta("SOURCE", "PREDICTION", item, sourceBenchmarks.get("PREDICTION")));
        return item;
    }

    private LotteryDecisionCandidateOutcome buildCandidateOutcome(LotteryDecisionSet decisionSet,
                                                                 LotteryDecisionCandidateSelection candidate,
                                                                 Map<String, LotteryPredictionSnapshot> snapshots,
                                                                 List<LotteryTicket> tickets) {
        List<LotteryTicket> matchedTickets = matchingTickets(decisionSet, candidate, tickets);
        LotteryPrizeResult prize = candidatePrize(candidate, snapshots, matchedTickets);
        BigDecimal totalCost = sumMoney(matchedTickets.stream().map(LotteryTicket::getCost).toList());
        BigDecimal totalPrize = sumMoney(matchedTickets.stream()
                .map(LotteryTicket::getPrizeResult)
                .map(this::prizeAmount)
                .toList());
        int checkedTickets = (int) matchedTickets.stream().filter(ticket -> ticket.getPrizeResult() != null).count();
        int winningTickets = (int) matchedTickets.stream()
                .filter(ticket -> ticket.getPrizeResult() != null && Boolean.TRUE.equals(ticket.getPrizeResult().getWinning()))
                .count();
        List<String> warnings = candidateWarnings(candidate, prize, matchedTickets, checkedTickets);
        return LotteryDecisionCandidateOutcome.builder()
                .decisionSetId(decisionSet.getId())
                .decisionSetTitle(decisionSet.getTitle())
                .candidateKey(candidate.getKey())
                .candidateTitle(candidate.getCandidateTitle())
                .source(candidate.getSource())
                .snapshotId(candidate.getSnapshotId())
                .ruleName(firstText(candidate.getRuleName(), decisionSet.getRuleName()))
                .targetIssue(firstText(value(candidate.getTargetPeriod()), decisionSet.getTargetIssue()))
                .redNumbers(candidate.getRedNumbers() == null ? List.of() : candidate.getRedNumbers())
                .blueNumber(candidate.getBlueNumber())
                .evidenceTag(candidate.getEvidence() == null ? null : candidate.getEvidence().getTag())
                .driftLabel(candidate.getDriftLabel())
                .redHits(prize == null ? null : prize.getRedHits())
                .blueHit(prize == null ? null : prize.getBlueHit())
                .prizeName(prize == null ? null : prize.getPrizeName())
                .resultState(resultState(prize, candidate.getResultState()))
                .convertedTicketCount(matchedTickets.size())
                .checkedTicketCount(checkedTickets)
                .winningTicketCount(winningTickets)
                .totalCost(totalCost)
                .totalPrize(totalPrize)
                .netResult(totalPrize.subtract(totalCost))
                .warnings(warnings)
                .build();
    }

    private LotteryDecisionOutcomeSummary summarizeOutcomes(List<LotteryDecisionOutcomeItem> items) {
        BigDecimal totalCost = sumMoney(items.stream().map(LotteryDecisionOutcomeItem::getTotalCost).toList());
        BigDecimal totalPrize = sumMoney(items.stream().map(LotteryDecisionOutcomeItem::getTotalPrize).toList());
        BigDecimal netResult = totalPrize.subtract(totalCost);
        int checkedTickets = items.stream().mapToInt(item -> safeInt(item.getCheckedConvertedTicketCount())).sum();
        int winningTickets = items.stream().mapToInt(item -> safeInt(item.getWinningConvertedTicketCount())).sum();
        Map<String, Integer> hitDistribution = new LinkedHashMap<>();
        Map<String, Integer> prizeDistribution = new LinkedHashMap<>();
        for (LotteryDecisionOutcomeItem item : items) {
            merge(hitDistribution, item.getHitDistribution());
            merge(prizeDistribution, item.getPrizeDistribution());
        }
        return LotteryDecisionOutcomeSummary.builder()
                .savedDecisionSetCount(items.size())
                .candidateCount(items.stream().mapToInt(item -> safeInt(item.getCandidateCount())).sum())
                .scoredCandidateCount(items.stream().mapToInt(item -> safeInt(item.getScoredCandidateCount())).sum())
                .winningCandidateCount(items.stream().mapToInt(item -> safeInt(item.getWinningCandidateCount())).sum())
                .convertedTicketCount(items.stream().mapToInt(item -> safeInt(item.getConvertedTicketCount())).sum())
                .checkedConvertedTicketCount(checkedTickets)
                .winningConvertedTicketCount(winningTickets)
                .totalCost(totalCost)
                .totalPrize(totalPrize)
                .netResult(netResult)
                .roiPercent(roiPercent(netResult, totalCost))
                .hitRatePercent(hitRatePercent(winningTickets, checkedTickets))
                .bestRedHits(items.stream()
                        .map(LotteryDecisionOutcomeItem::getBestRedHits)
                        .filter(Objects::nonNull)
                        .max(Integer::compareTo)
                        .orElse(null))
                .warningCount(items.stream().mapToInt(item -> safeInt(item.getWarningCount())).sum())
                .staleEvidenceCount(items.stream().mapToInt(item -> safeInt(item.getStaleEvidenceCount())).sum())
                .volatileEvidenceCount(items.stream().mapToInt(item -> safeInt(item.getVolatileEvidenceCount())).sum())
                .underTestedEvidenceCount(items.stream().mapToInt(item -> safeInt(item.getUnderTestedEvidenceCount())).sum())
                .hitDistribution(hitDistribution)
                .prizeDistribution(prizeDistribution)
                .items(items)
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    private Map<String, LotteryPredictionSnapshot> snapshotMap(List<LotteryDecisionSet> decisionSets) {
        List<String> ids = decisionSets.stream()
                .flatMap(set -> (set.getSelectedCandidates() == null ? List.<LotteryDecisionCandidateSelection>of() : set.getSelectedCandidates()).stream())
                .map(LotteryDecisionCandidateSelection::getSnapshotId)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<String, LotteryPredictionSnapshot> result = new HashMap<>();
        predictionSnapshotRepository.findAllById(ids).forEach(snapshot -> result.put(snapshot.getId(), snapshot));
        return result;
    }

    private Map<String, LotteryPerformanceLedger> performanceMap(List<LotteryPerformanceLedger> ledgers) {
        Map<String, LotteryPerformanceLedger> result = new LinkedHashMap<>();
        for (LotteryPerformanceLedger ledger : ledgers == null ? List.<LotteryPerformanceLedger>of() : ledgers) {
            result.putIfAbsent(performanceKey(ledger.getKey()), ledger);
            result.putIfAbsent(performanceKey(ledger.getName()), ledger);
        }
        return result;
    }

    private LotteryDecisionPerformanceDelta performanceDelta(String dimension,
                                                            String key,
                                                            LotteryDecisionOutcomeItem item,
                                                            LotteryPerformanceLedger benchmark) {
        BigDecimal decisionHitRate = hitRatePercent(item.getWinningConvertedTicketCount(), item.getCheckedConvertedTicketCount());
        BigDecimal benchmarkNet = benchmark == null ? null : nz(benchmark.getNetResult());
        BigDecimal benchmarkRoi = benchmark == null ? null : nz(benchmark.getRoiPercent());
        BigDecimal benchmarkHitRate = benchmark == null ? null : nz(benchmark.getHitRatePercent());
        return LotteryDecisionPerformanceDelta.builder()
                .dimension(dimension)
                .key(key)
                .name(benchmark == null ? key : benchmark.getName())
                .decisionTicketCount(item.getConvertedTicketCount())
                .benchmarkTicketCount(benchmark == null ? null : benchmark.getTicketCount())
                .decisionNetResult(nz(item.getNetResult()))
                .benchmarkNetResult(benchmarkNet)
                .netResultDelta(benchmarkNet == null ? null : nz(item.getNetResult()).subtract(benchmarkNet))
                .decisionRoiPercent(nz(item.getRoiPercent()))
                .benchmarkRoiPercent(benchmarkRoi)
                .roiPercentDelta(benchmarkRoi == null ? null : nz(item.getRoiPercent()).subtract(benchmarkRoi))
                .decisionHitRatePercent(decisionHitRate)
                .benchmarkHitRatePercent(benchmarkHitRate)
                .hitRatePercentDelta(benchmarkHitRate == null ? null : decisionHitRate.subtract(benchmarkHitRate))
                .backtestStabilityScore(benchmark == null || benchmark.getBacktestSummary() == null ? null : benchmark.getBacktestSummary().getStabilityScore())
                .backtestAverageRedHits(benchmark == null || benchmark.getBacktestSummary() == null ? null : benchmark.getBacktestSummary().getAverageRedHits())
                .backtestBlueHitRate(benchmark == null || benchmark.getBacktestSummary() == null ? null : benchmark.getBacktestSummary().getBlueHitRate())
                .build();
    }

    private List<LotteryTicket> matchingTickets(LotteryDecisionSet decisionSet,
                                                LotteryDecisionCandidateSelection candidate,
                                                List<LotteryTicket> tickets) {
        Set<String> convertedIds = new LinkedHashSet<>(candidate.getConvertedTicketIds() == null ? List.of() : candidate.getConvertedTicketIds());
        String issue = firstText(value(candidate.getTargetPeriod()), decisionSet.getTargetIssue());
        String candidateKey = numberKey(candidate.getRedNumbers(), candidate.getBlueNumber());
        return tickets.stream()
                .filter(ticket -> {
                    if (StringUtils.hasText(ticket.getId()) && convertedIds.contains(ticket.getId())) {
                        return true;
                    }
                    if (StringUtils.hasText(issue) && !issue.equals(ticketIssue(ticket))) {
                        return false;
                    }
                    if (!Objects.equals(candidateKey, numberKey(ticket.getRedNumbers(), ticket.getBlueNumber()))) {
                        return false;
                    }
                    return !StringUtils.hasText(candidate.getSnapshotId())
                            || candidate.getSnapshotId().equals(ticket.getPredictionSnapshotId())
                            || "PREDICTION".equals(normalizeState(ticket.getSource(), "UNKNOWN"));
                })
                .toList();
    }

    private LotteryPrizeResult candidatePrize(LotteryDecisionCandidateSelection candidate,
                                             Map<String, LotteryPredictionSnapshot> snapshots,
                                             List<LotteryTicket> matchedTickets) {
        LotteryPredictionSnapshot snapshot = StringUtils.hasText(candidate.getSnapshotId()) ? snapshots.get(candidate.getSnapshotId()) : null;
        LotteryActualRecord actual = snapshot == null ? null : snapshot.getActualRecord();
        if (actual != null && actual.getRedNumbers() != null && StringUtils.hasText(actual.getBlueNumber())) {
            try {
                return LotteryPrizeCalculator.calculate(candidate.getRedNumbers(), candidate.getBlueNumber(), actual.getRedNumbers(), actual.getBlueNumber());
            } catch (IllegalArgumentException ignored) {
                // Fall through to any checked converted ticket result.
            }
        }
        return matchedTickets.stream()
                .map(LotteryTicket::getPrizeResult)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    private List<String> candidateWarnings(LotteryDecisionCandidateSelection candidate,
                                           LotteryPrizeResult prize,
                                           List<LotteryTicket> matchedTickets,
                                           int checkedTickets) {
        List<String> warnings = new ArrayList<>();
        addIfText(warnings, candidate.getWarning());
        String evidenceTag = candidate.getEvidence() == null ? null : candidate.getEvidence().getTag();
        if ("STALE".equals(evidenceTag)) {
            warnings.add("证据过期，建议重新训练后再复盘");
        }
        if ("VOLATILE".equals(evidenceTag)) {
            warnings.add("规则波动，结果需要和其他规则对照");
        }
        if ("UNDER_TESTED".equals(evidenceTag)) {
            warnings.add("样本不足，命中结果只能作为观察证据");
        }
        if (prize == null) {
            warnings.add("等待实际开奖或快照结果");
        }
        if (matchedTickets.isEmpty()) {
            warnings.add("尚未转为票据");
        } else if (checkedTickets < matchedTickets.size()) {
            warnings.add("转票尚未全部核奖");
        }
        return warnings.stream().distinct().toList();
    }

    private String firstCandidateRule(LotteryDecisionSet decisionSet) {
        if (decisionSet.getSelectedCandidates() == null) {
            return null;
        }
        return decisionSet.getSelectedCandidates().stream()
                .map(candidate -> firstText(candidate.getRuleName(), candidate.getRuleId()))
                .filter(StringUtils::hasText)
                .findFirst()
                .orElse(null);
    }

    private String resultState(LotteryPrizeResult prize, String fallback) {
        if (prize == null) {
            return normalizeState(fallback, "PENDING");
        }
        return Boolean.TRUE.equals(prize.getWinning()) ? "WON" : "MISSED";
    }

    private BigDecimal sumMoney(List<BigDecimal> values) {
        return values == null ? BigDecimal.ZERO : values.stream()
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal prizeAmount(LotteryPrizeResult result) {
        if (result == null || result.getPrizeAmount() == null) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(result.getPrizeAmount()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal roiPercent(BigDecimal netResult, BigDecimal totalCost) {
        BigDecimal cost = nz(totalCost);
        if (cost.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return nz(netResult).multiply(BigDecimal.valueOf(100)).divide(cost, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal hitRatePercent(Integer winningCount, Integer checkedCount) {
        int checked = safeInt(checkedCount);
        if (checked == 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(safeInt(winningCount) * 100L).divide(BigDecimal.valueOf(checked), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private void increment(Map<String, Integer> target, String key) {
        if (StringUtils.hasText(key)) {
            target.put(key, target.getOrDefault(key, 0) + 1);
        }
    }

    private void merge(Map<String, Integer> target, Map<String, Integer> source) {
        if (source == null) {
            return;
        }
        source.forEach((key, value) -> target.put(key, target.getOrDefault(key, 0) + safeInt(value)));
    }

    private void addIfText(List<String> target, String value) {
        if (StringUtils.hasText(value)) {
            target.add(value.trim());
        }
    }

    private String ticketIssue(LotteryTicket ticket) {
        return firstText(ticket.getIssue(), value(ticket.getPeriod()));
    }

    private String numberKey(List<String> redNumbers, String blueNumber) {
        try {
            return String.join(" ", LotteryDrawUtil.normalizeRedNumbers(redNumbers)) + "|" + LotteryDrawUtil.normalizeBlueNumber(blueNumber);
        } catch (IllegalArgumentException exception) {
            return String.join(" ", redNumbers == null ? List.of() : redNumbers) + "|" + normalizeText(blueNumber);
        }
    }

    private String performanceKey(String value) {
        return StringUtils.hasText(value) ? value.trim().toUpperCase(Locale.ROOT) : "UNKNOWN";
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private String value(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private LotteryDecisionSet loadOwnedDecisionSet(String id) {
        if (!StringUtils.hasText(id)) {
            throw new IllegalArgumentException("决策集 ID 不能为空");
        }
        return repository.findByIdAndUserId(id, DEFAULT_USER_ID)
                .orElseThrow(() -> new IllegalArgumentException("决策集不存在: " + id));
    }

    private void applyMutableFields(LotteryDecisionSet target, LotteryDecisionSet source) {
        Integer targetPeriod = source == null ? null : source.getTargetPeriod();
        String targetIssue = normalizeText(source == null ? null : source.getTargetIssue());
        if (targetPeriod == null) {
            targetPeriod = parseInteger(targetIssue);
        }
        target.setTargetIssue(targetIssue);
        target.setTargetPeriod(targetPeriod);
        target.setTitle(normalizeTitle(source == null ? null : source.getTitle(), targetPeriod));
        target.setRuleName(normalizeText(source == null ? null : source.getRuleName()));
        target.setEvidenceState(normalizeState(source == null ? null : source.getEvidenceState(), "ALL"));
        target.setResultState(normalizeState(source == null ? null : source.getResultState(), "ALL"));
        target.setConversionState(normalizeState(source == null ? null : source.getConversionState(), "DRAFT"));
        target.setNote(normalizeText(source == null ? null : source.getNote()));
        target.setSelectedCandidates(normalizeCandidates(source == null ? null : source.getSelectedCandidates()));
    }

    private List<LotteryDecisionCandidateSelection> normalizeCandidates(List<LotteryDecisionCandidateSelection> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return new ArrayList<>();
        }
        return candidates.stream()
                .filter(candidate -> candidate != null && (candidate.getRedNumbers() != null || StringUtils.hasText(candidate.getBlueNumber())))
                .limit(MAX_CANDIDATES)
                .map(this::normalizeCandidate)
                .toList();
    }

    private LotteryDecisionCandidateSelection normalizeCandidate(LotteryDecisionCandidateSelection candidate) {
        return LotteryDecisionCandidateSelection.builder()
                .key(normalizeText(candidate.getKey()))
                .snapshotId(normalizeText(candidate.getSnapshotId()))
                .snapshotTitle(normalizeText(candidate.getSnapshotTitle()))
                .candidateTitle(normalizeCandidateTitle(candidate.getCandidateTitle()))
                .source(normalizeState(candidate.getSource(), "CANDIDATE"))
                .targetPeriod(candidate.getTargetPeriod())
                .ruleId(normalizeText(candidate.getRuleId()))
                .ruleName(normalizeText(candidate.getRuleName()))
                .redNumbers(normalizeNumbers(candidate.getRedNumbers()))
                .blueNumber(normalizeText(candidate.getBlueNumber()))
                .score(candidate.getScore())
                .evidence(candidate.getEvidence())
                .replayText(normalizeText(candidate.getReplayText()))
                .driftLabel(normalizeText(candidate.getDriftLabel()))
                .resultLabel(normalizeText(candidate.getResultLabel()))
                .resultState(normalizeState(candidate.getResultState(), "PENDING"))
                .redOverlap(candidate.getRedOverlap())
                .blueOverlap(Boolean.TRUE.equals(candidate.getBlueOverlap()))
                .ticketCount(candidate.getTicketCount() == null || candidate.getTicketCount() < 0 ? 0 : candidate.getTicketCount())
                .ticketState(normalizeText(candidate.getTicketState()))
                .warning(normalizeText(candidate.getWarning()))
                .convertedTicketIds(normalizeIds(candidate.getConvertedTicketIds()))
                .build();
    }

    private List<String> normalizeNumbers(List<String> numbers) {
        if (numbers == null || numbers.isEmpty()) {
            return new ArrayList<>();
        }
        return numbers.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .limit(6)
                .toList();
    }

    private List<String> normalizeIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }
        return ids.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .limit(50)
                .toList();
    }

    private void saveAuditEvent(String eventType, LotteryDecisionSet decisionSet, String message) {
        Map<String, String> filters = new LinkedHashMap<>();
        if (StringUtils.hasText(decisionSet.getTargetIssue())) {
            filters.put("targetIssue", decisionSet.getTargetIssue());
        }
        if (StringUtils.hasText(decisionSet.getRuleName())) {
            filters.put("ruleName", decisionSet.getRuleName());
        }
        filters.put("conversionState", decisionSet.getConversionState());
        auditEventRepository.save(LotteryAuditEvent.builder()
                .eventType(eventType)
                .targetType("decision-set")
                .targetId(decisionSet.getId())
                .requesterScope(REQUESTER_SCOPE)
                .filters(filters)
                .rowCount(decisionSet.getSelectedCandidates() == null ? 0 : decisionSet.getSelectedCandidates().size())
                .message(message)
                .generatedAt(System.currentTimeMillis())
                .build());
    }

    private LotteryAuditMetadata audit(String action, long createdAt, long updatedAt) {
        return LotteryAuditMetadata.builder()
                .action(action)
                .source("decision-set-service")
                .requesterScope(REQUESTER_SCOPE)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();
    }

    private long createdAt(LotteryDecisionSet target, long fallback) {
        return target.getCreatedAt() == null ? fallback : target.getCreatedAt();
    }

    private int normalizePage(Integer page) {
        return page == null || page < 1 ? DEFAULT_PAGE : page;
    }

    private int normalizePageSize(Integer pageSize) {
        if (pageSize == null || pageSize < 1) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(MAX_PAGE_SIZE, pageSize);
    }

    private String normalizeTitle(String title, Integer targetPeriod) {
        String normalized = normalizeText(title);
        if (StringUtils.hasText(normalized)) {
            return normalized;
        }
        return targetPeriod == null ? "预测决策集" : "第 " + targetPeriod + " 期决策集";
    }

    private String normalizeCandidateTitle(String title) {
        String normalized = normalizeText(title);
        return StringUtils.hasText(normalized) ? normalized : "候选号码";
    }

    private String normalizeState(String state, String defaultState) {
        return StringUtils.hasText(state) ? state.trim().toUpperCase(Locale.ROOT) : defaultState;
    }

    private String normalizeText(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private Integer parseInteger(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
