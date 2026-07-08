package com.one.record.service.impl;

import com.one.record.lottery.LotteryAuditMetadata;
import com.one.record.lottery.LotteryBacktestRunRequest;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryBacktestReport;
import com.one.record.model.LotteryDecisionCandidateSelection;
import com.one.record.model.LotteryDecisionSet;
import com.one.record.repository.LotteryBacktestReportRepository;
import com.one.record.repository.LotteryDecisionSetRepository;
import com.one.record.response.Record;
import com.one.record.service.ILotteryBacktestService;
import com.one.record.service.IRecordService;
import com.one.record.util.LotteryDrawUtil;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.Set;

@Service
@AllArgsConstructor
public class LotteryBacktestService implements ILotteryBacktestService {

    private static final int DEFAULT_WINDOW = 30;

    private static final int MAX_WINDOW = 500;

    private static final int DEFAULT_PAGE_SIZE = 20;

    private static final int MAX_PAGE_SIZE = 100;

    private static final BigDecimal TICKET_COST = new BigDecimal("2");

    private final LotteryBacktestReportRepository repository;

    private final LotteryDecisionSetRepository decisionSetRepository;

    private final IRecordService recordService;

    @Override
    public LotteryBacktestReport run(LotteryBacktestRunRequest request) {
        LotteryBacktestRunRequest normalized = normalizeRequest(request);
        List<Record> records = recordService.findAll().stream()
                .filter(record -> StringUtils.hasText(record.getCode()))
                .sorted(Comparator.comparing(Record::getCode))
                .toList();
        List<Record> scoped = scope(records, normalized);
        List<LotteryBacktestReport.ReplayRow> rows = StringUtils.hasText(normalized.getDecisionSetId())
                ? buildDecisionSetRows(scoped, normalized.getDecisionSetId())
                : buildRows(scoped);
        LotteryBacktestReport report = buildReport(normalized, rows);
        return repository.save(report);
    }

    @Override
    public LotteryPageResponse<LotteryBacktestReport> reports(Integer page,
                                                              Integer pageSize,
                                                              String strategyName,
                                                              String presetWindow,
                                                              Long createdStartAt,
                                                              Long createdEndAt) {
        int safePage = normalizePage(page);
        int safePageSize = normalizePageSize(pageSize);
        String safeStrategyName = normalizeOptional(strategyName);
        String safePreset = normalizeOptional(presetWindow);
        List<LotteryBacktestReport> filtered = repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .filter(item -> safeStrategyName == null || containsNormalized(item.getStrategyName(), safeStrategyName))
                .filter(item -> safePreset == null || safePreset.equals(normalizeOptional(item.getPresetWindow())))
                .filter(item -> createdStartAt == null || item.getCreatedAt() != null && item.getCreatedAt() >= createdStartAt)
                .filter(item -> createdEndAt == null || item.getCreatedAt() != null && item.getCreatedAt() <= createdEndAt)
                .toList();
        return pageOf(filtered, safePage, safePageSize);
    }

    @Override
    public LotteryBacktestReport detail(String id) {
        if (!StringUtils.hasText(id)) {
            return null;
        }
        return repository.findById(id.trim()).orElse(null);
    }

    private static LotteryBacktestRunRequest normalizeRequest(LotteryBacktestRunRequest request) {
        String preset = StringUtils.hasText(request == null ? null : request.getPresetWindow())
                ? request.getPresetWindow().trim().toLowerCase(Locale.ROOT)
                : "latest-30";
        int window = request == null ? DEFAULT_WINDOW : normalizeWindow(request.getWindow(), preset);
        return LotteryBacktestRunRequest.builder()
                .experimentId(trimToNull(request == null ? null : request.getExperimentId()))
                .decisionSetId(trimToNull(request == null ? null : request.getDecisionSetId()))
                .strategyName(StringUtils.hasText(request == null ? null : request.getStrategyName())
                        ? request.getStrategyName().trim()
                        : "上一期基线")
                .presetWindow(preset)
                .window(window)
                .issueStart(trimToNull(request == null ? null : request.getIssueStart()))
                .issueEnd(trimToNull(request == null ? null : request.getIssueEnd()))
                .build();
    }

    private static int normalizeWindow(Integer window, String preset) {
        if (window != null && window > 0) {
            return Math.min(window, MAX_WINDOW);
        }
        if ("latest-100".equals(preset)) {
            return 100;
        }
        if ("latest-300".equals(preset)) {
            return 300;
        }
        return DEFAULT_WINDOW;
    }

    private static List<Record> scope(List<Record> records, LotteryBacktestRunRequest request) {
        List<Record> scoped = records;
        if (StringUtils.hasText(request.getIssueStart()) && StringUtils.hasText(request.getIssueEnd())) {
            scoped = records.stream()
                    .filter(record -> record.getCode().compareTo(request.getIssueStart()) >= 0)
                    .filter(record -> record.getCode().compareTo(request.getIssueEnd()) <= 0)
                    .toList();
        }
        int window = Math.min(request.getWindow() + 1, scoped.size());
        return scoped.subList(Math.max(0, scoped.size() - window), scoped.size());
    }

    private static List<LotteryBacktestReport.ReplayRow> buildRows(List<Record> records) {
        if (records == null || records.size() < 2) {
            return List.of();
        }
        return java.util.stream.IntStream.range(1, records.size())
                .mapToObj(index -> row(records.get(index - 1), records.get(index)))
                .toList();
    }

    private List<LotteryBacktestReport.ReplayRow> buildDecisionSetRows(List<Record> records, String decisionSetId) {
        LotteryDecisionSet decisionSet = decisionSetRepository.findById(decisionSetId).orElse(null);
        if (decisionSet == null || decisionSet.getSelectedCandidates() == null || decisionSet.getSelectedCandidates().isEmpty()) {
            return List.of();
        }
        List<LotteryDecisionCandidateSelection> candidates = decisionSet.getSelectedCandidates().stream()
                .filter(candidate -> candidate != null && candidate.getRedNumbers() != null && candidate.getRedNumbers().size() >= 6 && StringUtils.hasText(candidate.getBlueNumber()))
                .toList();
        if (records == null || records.isEmpty() || candidates.isEmpty()) {
            return List.of();
        }
        return records.stream()
                .flatMap(record -> candidates.stream().map(candidate -> candidateRow(record, candidate)))
                .toList();
    }

    private static LotteryBacktestReport.ReplayRow row(Record previous, Record actual) {
        List<String> predictedRed = LotteryDrawUtil.normalizeRedNumbers(previous.getRed());
        String predictedBlue = LotteryDrawUtil.normalizeBlueNumber(previous.getBlue());
        return row(actual, predictedRed, predictedBlue);
    }

    private static LotteryBacktestReport.ReplayRow candidateRow(Record actual, LotteryDecisionCandidateSelection candidate) {
        List<String> predictedRed = candidate.getRedNumbers().stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .limit(6)
                .toList();
        String predictedBlue = LotteryDrawUtil.normalizeBlueNumber(candidate.getBlueNumber());
        return row(actual, predictedRed, predictedBlue);
    }

    private static LotteryBacktestReport.ReplayRow row(Record actual, List<String> predictedRed, String predictedBlue) {
        List<String> actualRed = LotteryDrawUtil.normalizeRedNumbers(actual.getRed());
        String actualBlue = LotteryDrawUtil.normalizeBlueNumber(actual.getBlue());
        Set<String> actualRedSet = Set.copyOf(actualRed);
        int redHits = (int) predictedRed.stream().filter(actualRedSet::contains).count();
        boolean blueHit = predictedBlue.equals(actualBlue);
        Prize prize = prize(redHits, blueHit);
        BigDecimal net = prize.amount.subtract(TICKET_COST);
        return LotteryBacktestReport.ReplayRow.builder()
                .issue(actual.getCode())
                .drawDate(actual.getDate() == null ? null : actual.getDate().substring(0, Math.min(10, actual.getDate().length())))
                .predictedRedNumbers(predictedRed)
                .predictedBlueNumber(predictedBlue)
                .actualRedNumbers(actualRed)
                .actualBlueNumber(actualBlue)
                .redHits(redHits)
                .blueHit(blueHit)
                .prizeName(prize.name)
                .score(redHits * 10 + (blueHit ? 8 : 0))
                .cost(TICKET_COST)
                .prize(prize.amount)
                .netResult(net)
                .build();
    }

    private static List<LotteryBacktestReport.ReplayRow> randomBaselineRows(List<LotteryBacktestReport.ReplayRow> rows) {
        return rows.stream()
                .map(row -> {
                    Random random = new Random((row.getIssue() == null ? "baseline" : row.getIssue()).hashCode());
                    List<String> predictedRed = random.ints(1, 34)
                            .distinct()
                            .limit(6)
                            .sorted()
                            .mapToObj(number -> String.format("%02d", number))
                            .toList();
                    String predictedBlue = String.format("%02d", random.nextInt(16) + 1);
                    Record actual = new Record();
                    actual.setCode(row.getIssue());
                    actual.setDate(row.getDrawDate());
                    actual.setRed(String.join(",", row.getActualRedNumbers()));
                    actual.setBlue(row.getActualBlueNumber());
                    return row(actual, predictedRed, predictedBlue);
                })
                .toList();
    }

    private static LotteryBacktestReport buildReport(LotteryBacktestRunRequest request, List<LotteryBacktestReport.ReplayRow> rows) {
        List<LotteryBacktestReport.ReplayRow> baselineRows = randomBaselineRows(rows);
        Summary baseline = summarize(baselineRows);
        Summary summary = summarize(rows);
        BigDecimal balance = BigDecimal.ZERO;
        List<LotteryBacktestReport.BankrollPoint> bankroll = new java.util.ArrayList<>();
        for (LotteryBacktestReport.ReplayRow row : rows) {
            balance = balance.add(row.getNetResult());
            bankroll.add(LotteryBacktestReport.BankrollPoint.builder()
                    .issue(row.getIssue())
                    .balance(balance)
                    .build());
        }
        return LotteryBacktestReport.builder()
                .experimentId(request.getExperimentId())
                .strategyName(request.getStrategyName())
                .presetWindow(request.getPresetWindow())
                .requestedWindow(request.getWindow())
                .issueStart(rows.isEmpty() ? request.getIssueStart() : rows.get(0).getIssue())
                .issueEnd(rows.isEmpty() ? request.getIssueEnd() : rows.get(rows.size() - 1).getIssue())
                .replayCount(rows.size())
                .averageRedHits(summary.averageRedHits())
                .blueHitRate(summary.blueHitRate())
                .baselineAverageRedHits(baseline.averageRedHits())
                .baselineBlueHitRate(baseline.blueHitRate())
                .bestScore(summary.bestScore())
                .stabilityScore(stabilityScore(rows, summary.averageRedHits()))
                .totalCost(summary.totalCost())
                .totalPrize(summary.totalPrize())
                .netResult(summary.totalPrize().subtract(summary.totalCost()))
                .prizeDistribution(summary.prizeDistribution())
                .baselinePrizeDistribution(baseline.prizeDistribution())
                .rows(rows)
                .bankrollSimulation(bankroll)
                .createdAt(System.currentTimeMillis())
                .auditMetadata(audit("backtest-run", "backtest-service", System.currentTimeMillis()))
                .build();
    }

    private static Summary summarize(List<LotteryBacktestReport.ReplayRow> rows) {
        Map<String, Integer> prizeDistribution = new LinkedHashMap<>();
        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalPrize = BigDecimal.ZERO;
        int redHits = 0;
        int blueHits = 0;
        int bestScore = 0;
        for (LotteryBacktestReport.ReplayRow row : rows) {
            prizeDistribution.put(row.getPrizeName(), prizeDistribution.getOrDefault(row.getPrizeName(), 0) + 1);
            totalCost = totalCost.add(row.getCost());
            totalPrize = totalPrize.add(row.getPrize());
            redHits += row.getRedHits();
            if (Boolean.TRUE.equals(row.getBlueHit())) {
                blueHits += 1;
            }
            bestScore = Math.max(bestScore, row.getScore());
        }
        int count = rows.size();
        BigDecimal averageRedHits = count == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(redHits).divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
        BigDecimal blueHitRate = count == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(blueHits * 100L).divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
        return new Summary(averageRedHits, blueHitRate, bestScore, totalCost, totalPrize, prizeDistribution);
    }

    private static LotteryAuditMetadata audit(String action, String source, long now) {
        return LotteryAuditMetadata.builder()
                .action(action)
                .source(source)
                .requesterScope("default")
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private static int stabilityScore(List<LotteryBacktestReport.ReplayRow> rows, BigDecimal averageRedHits) {
        if (rows == null || rows.isEmpty()) {
            return 0;
        }
        double average = averageRedHits.doubleValue();
        double variance = rows.stream()
                .mapToDouble(row -> Math.pow(row.getRedHits() - average, 2))
                .average()
                .orElse(0);
        return Math.max(0, Math.min(100, (int) Math.round(100 - variance * 20)));
    }

    private static Prize prize(int redHits, boolean blueHit) {
        if (redHits == 6 && blueHit) return new Prize("一等奖", new BigDecimal("5000000"));
        if (redHits == 6) return new Prize("二等奖", new BigDecimal("100000"));
        if (redHits == 5 && blueHit) return new Prize("三等奖", new BigDecimal("3000"));
        if (redHits == 5 || redHits == 4 && blueHit) return new Prize("四等奖", new BigDecimal("200"));
        if (redHits == 4 || redHits == 3 && blueHit) return new Prize("五等奖", new BigDecimal("10"));
        if (blueHit) return new Prize("六等奖", new BigDecimal("5"));
        return new Prize("未中奖", BigDecimal.ZERO);
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private static int normalizePage(Integer page) {
        return page == null || page < 0 ? 0 : page;
    }

    private static int normalizePageSize(Integer pageSize) {
        if (pageSize == null || pageSize <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(pageSize, MAX_PAGE_SIZE);
    }

    private static String normalizeOptional(String value) {
        return StringUtils.hasText(value) ? value.trim().toUpperCase(Locale.ROOT) : null;
    }

    private static boolean containsNormalized(String value, String expectedUppercase) {
        return StringUtils.hasText(value) && value.trim().toUpperCase(Locale.ROOT).contains(expectedUppercase);
    }

    private static LotteryPageResponse<LotteryBacktestReport> pageOf(List<LotteryBacktestReport> items, int page, int pageSize) {
        int total = items == null ? 0 : items.size();
        int from = Math.min(page * pageSize, total);
        int to = Math.min(from + pageSize, total);
        return LotteryPageResponse.<LotteryBacktestReport>builder()
                .items(items == null ? List.of() : items.subList(from, to))
                .page(page)
                .pageSize(pageSize)
                .total((long) total)
                .hasNext(to < total)
                .build();
    }

    private record Prize(String name, BigDecimal amount) {
    }

    private record Summary(BigDecimal averageRedHits,
                           BigDecimal blueHitRate,
                           int bestScore,
                           BigDecimal totalCost,
                           BigDecimal totalPrize,
                           Map<String, Integer> prizeDistribution) {
    }
}
