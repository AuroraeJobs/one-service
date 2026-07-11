package com.one.record.service.impl;

import com.one.record.lottery.LotteryAuditMetadata;
import com.one.record.lottery.LotteryBacktestRunRequest;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryResearchProvenance;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
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

    private static final long DEFAULT_BASELINE_SEED = 42L;

    private static final String BASELINE_ALGORITHM = "FNV1A64_JAVA_RANDOM_V1";

    private static final String DECISION_EVALUATION_MODE = "STATIC_POOL_HISTORICAL_REPLAY";

    private static final String PREVIOUS_DRAW_EVALUATION_MODE = "PREVIOUS_DRAW_HISTORICAL_REPLAY";

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
        boolean decisionMode = StringUtils.hasText(normalized.getDecisionSetId());
        LotteryDecisionSet decisionSet = decisionMode
                ? decisionSetRepository.findById(normalized.getDecisionSetId())
                .orElseThrow(() -> new IllegalArgumentException("彩票决策集不存在: " + normalized.getDecisionSetId()))
                : null;
        List<Record> scoped = scope(records, normalized, decisionMode);
        List<LotteryBacktestReport.ReplayRow> rows = decisionMode
                ? buildDecisionSetRows(scoped, decisionSet)
                : buildRows(scoped);
        LotteryBacktestReport report = buildReport(normalized, rows, decisionSet);
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
                .baselineSeed(request == null || request.getBaselineSeed() == null ? DEFAULT_BASELINE_SEED : request.getBaselineSeed())
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

    private static List<Record> scope(List<Record> records,
                                      LotteryBacktestRunRequest request,
                                      boolean decisionMode) {
        List<Record> scoped = records;
        if (StringUtils.hasText(request.getIssueStart()) || StringUtils.hasText(request.getIssueEnd())) {
            scoped = records.stream()
                    .filter(record -> !StringUtils.hasText(request.getIssueStart()) || record.getCode().compareTo(request.getIssueStart()) >= 0)
                    .filter(record -> !StringUtils.hasText(request.getIssueEnd()) || record.getCode().compareTo(request.getIssueEnd()) <= 0)
                    .toList();
        }
        int requiredRecords = decisionMode ? request.getWindow() : request.getWindow() + 1;
        int window = Math.min(requiredRecords, scoped.size());
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

    private static List<LotteryBacktestReport.ReplayRow> buildDecisionSetRows(List<Record> records,
                                                                              LotteryDecisionSet decisionSet) {
        if (decisionSet == null || decisionSet.getSelectedCandidates() == null || decisionSet.getSelectedCandidates().isEmpty()) {
            return List.of();
        }
        List<LotteryDecisionCandidateSelection> candidates = decisionSet.getSelectedCandidates().stream()
                .filter(candidate -> candidate != null && candidate.getRedNumbers() != null && candidate.getRedNumbers().size() >= 6 && StringUtils.hasText(candidate.getBlueNumber()))
                .toList();
        if (records == null || records.isEmpty() || candidates.isEmpty()) {
            return List.of();
        }
        List<LotteryBacktestReport.ReplayRow> rows = new ArrayList<>();
        for (Record record : records) {
            for (int index = 0; index < candidates.size(); index++) {
                rows.add(candidateRow(record, candidates.get(index), index));
            }
        }
        return rows;
    }

    private static LotteryBacktestReport.ReplayRow row(Record previous, Record actual) {
        List<String> predictedRed = LotteryDrawUtil.normalizeRedNumbers(previous.getRed());
        String predictedBlue = LotteryDrawUtil.normalizeBlueNumber(previous.getBlue());
        return row(actual, predictedRed, predictedBlue);
    }

    private static LotteryBacktestReport.ReplayRow candidateRow(Record actual,
                                                                 LotteryDecisionCandidateSelection candidate,
                                                                 int candidateSlot) {
        List<String> predictedRed = candidate.getRedNumbers().stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .limit(6)
                .toList();
        String predictedBlue = LotteryDrawUtil.normalizeBlueNumber(candidate.getBlueNumber());
        LotteryBacktestReport.ReplayRow row = row(actual, predictedRed, predictedBlue);
        row.setCandidateKey(firstText(candidate.getKey(), numberKey(predictedRed, predictedBlue)));
        row.setGenerationId(candidate.getGenerationId());
        row.setCandidateSlot(candidateSlot);
        return row;
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

    private static List<LotteryBacktestReport.ReplayRow> randomBaselineRows(List<LotteryBacktestReport.ReplayRow> rows,
                                                                            long baseSeed) {
        List<LotteryBacktestReport.ReplayRow> baselineRows = new ArrayList<>();
        Map<String, Set<String>> usedByIssue = new LinkedHashMap<>();
        for (int index = 0; index < rows.size(); index++) {
            LotteryBacktestReport.ReplayRow source = rows.get(index);
            String issue = firstText(source.getIssue(), "unknown");
            int slot = source.getCandidateSlot() == null ? index : source.getCandidateSlot();
            Set<String> used = usedByIssue.computeIfAbsent(issue, ignored -> new LinkedHashSet<>());
            int attempt = 0;
            List<String> predictedRed;
            String predictedBlue;
            long derivedSeed;
            String ticketKey;
            do {
                derivedSeed = deriveBaselineSeed(baseSeed, issue, slot, attempt++);
                Random random = new Random(derivedSeed);
                predictedRed = random.ints(1, 34)
                        .distinct()
                        .limit(6)
                        .sorted()
                        .mapToObj(number -> String.format("%02d", number))
                        .toList();
                predictedBlue = String.format("%02d", random.nextInt(16) + 1);
                ticketKey = numberKey(predictedRed, predictedBlue);
            } while (used.contains(ticketKey));
            used.add(ticketKey);
            Record actual = new Record();
            actual.setCode(source.getIssue());
            actual.setDate(source.getDrawDate());
            actual.setRed(String.join(",", source.getActualRedNumbers()));
            actual.setBlue(source.getActualBlueNumber());
            LotteryBacktestReport.ReplayRow baselineRow = row(actual, predictedRed, predictedBlue);
            baselineRow.setCandidateKey("random:" + issue + ":" + slot);
            baselineRow.setCandidateSlot(slot);
            baselineRow.setSeed(derivedSeed);
            baselineRows.add(baselineRow);
        }
        return baselineRows;
    }

    private static LotteryBacktestReport buildReport(LotteryBacktestRunRequest request,
                                                      List<LotteryBacktestReport.ReplayRow> rows,
                                                      LotteryDecisionSet decisionSet) {
        long baselineSeed = request.getBaselineSeed() == null ? DEFAULT_BASELINE_SEED : request.getBaselineSeed();
        List<LotteryBacktestReport.ReplayRow> baselineRows = randomBaselineRows(rows, baselineSeed);
        Summary baseline = summarize(baselineRows);
        Summary summary = summarize(rows);
        BigDecimal netResult = summary.totalPrize().subtract(summary.totalCost());
        BigDecimal baselineNetResult = baseline.totalPrize().subtract(baseline.totalCost());
        BigDecimal roiPercent = roiPercent(netResult, summary.totalCost());
        BigDecimal baselineRoiPercent = roiPercent(baselineNetResult, baseline.totalCost());
        BigDecimal averageRedHitsDelta = summary.averageRedHits().subtract(baseline.averageRedHits());
        BigDecimal blueHitRateDelta = summary.blueHitRate().subtract(baseline.blueHitRate());
        BigDecimal totalPrizeDelta = summary.totalPrize().subtract(baseline.totalPrize());
        BigDecimal netResultDelta = netResult.subtract(baselineNetResult);
        BigDecimal roiPercentDelta = roiPercent.subtract(baselineRoiPercent);
        boolean sameWindow = sameWindow(rows, baselineRows);
        boolean sameBudget = summary.totalCost().compareTo(baseline.totalCost()) == 0;
        int windowIssueCount = (int) rows.stream().map(LotteryBacktestReport.ReplayRow::getIssue).filter(StringUtils::hasText).distinct().count();
        List<LotteryBacktestReport.ReplayRow> poolRows = candidatePoolRows(rows, decisionSet != null);
        int candidateCount = decisionSet == null ? (rows.isEmpty() ? 0 : 1) : poolRows.size();
        int uniqueCandidateCount = (int) poolRows.stream()
                .map(row -> numberKey(row.getPredictedRedNumbers(), row.getPredictedBlueNumber()))
                .distinct()
                .count();
        BigDecimal candidateDiversity = ratePercent(uniqueCandidateCount, candidateCount);
        int maxRedOverlap = maximumRedOverlap(poolRows);
        int distinctBlueCount = (int) poolRows.stream()
                .map(LotteryBacktestReport.ReplayRow::getPredictedBlueNumber)
                .filter(StringUtils::hasText)
                .distinct()
                .count();
        String evaluationMode = decisionSet == null ? PREVIOUS_DRAW_EVALUATION_MODE : DECISION_EVALUATION_MODE;
        List<String> overfitWarnings = warnings(
                rows,
                decisionSet,
                windowIssueCount,
                candidateCount,
                candidateDiversity,
                averageRedHitsDelta,
                blueHitRateDelta,
                roiPercentDelta,
                sameWindow,
                sameBudget
        );
        BigDecimal balance = BigDecimal.ZERO;
        List<LotteryBacktestReport.BankrollPoint> bankroll = new ArrayList<>();
        for (LotteryBacktestReport.ReplayRow row : rows) {
            balance = balance.add(row.getNetResult());
            bankroll.add(LotteryBacktestReport.BankrollPoint.builder()
                    .issue(row.getIssue())
                    .balance(balance)
                    .build());
        }
        return LotteryBacktestReport.builder()
                .experimentId(request.getExperimentId())
                .decisionSetId(request.getDecisionSetId())
                .provenance(copyProvenance(decisionSet == null ? null : decisionSet.getProvenance()))
                .strategyName(request.getStrategyName())
                .presetWindow(request.getPresetWindow())
                .requestedWindow(request.getWindow())
                .issueStart(rows.isEmpty() ? request.getIssueStart() : rows.get(0).getIssue())
                .issueEnd(rows.isEmpty() ? request.getIssueEnd() : rows.get(rows.size() - 1).getIssue())
                .replayCount(rows.size())
                .baselineSeed(baselineSeed)
                .baselineAlgorithm(BASELINE_ALGORITHM)
                .windowIssueCount(windowIssueCount)
                .candidateCount(candidateCount)
                .uniqueCandidateCount(uniqueCandidateCount)
                .ticketCount(rows.size())
                .baselineTicketCount(baselineRows.size())
                .sameWindow(sameWindow)
                .sameBudget(sameBudget)
                .averageRedHits(summary.averageRedHits())
                .blueHitRate(summary.blueHitRate())
                .baselineAverageRedHits(baseline.averageRedHits())
                .baselineBlueHitRate(baseline.blueHitRate())
                .bestScore(summary.bestScore())
                .stabilityScore(stabilityScore(rows, summary.averageRedHits()))
                .totalCost(summary.totalCost())
                .totalPrize(summary.totalPrize())
                .netResult(netResult)
                .roiPercent(roiPercent)
                .baselineTotalCost(baseline.totalCost())
                .baselineTotalPrize(baseline.totalPrize())
                .baselineNetResult(baselineNetResult)
                .baselineRoiPercent(baselineRoiPercent)
                .averageRedHitsDelta(averageRedHitsDelta)
                .blueHitRateDelta(blueHitRateDelta)
                .totalPrizeDelta(totalPrizeDelta)
                .netResultDelta(netResultDelta)
                .roiPercentDelta(roiPercentDelta)
                .candidateDiversity(candidateDiversity)
                .prizeDistribution(summary.prizeDistribution())
                .baselinePrizeDistribution(baseline.prizeDistribution())
                .hitDistribution(summary.hitDistribution())
                .baselineHitDistribution(baseline.hitDistribution())
                .maxRedOverlap(maxRedOverlap)
                .distinctBlueCount(distinctBlueCount)
                .evaluationMode(evaluationMode)
                .overfitWarnings(overfitWarnings)
                .rows(rows)
                .baselineRows(baselineRows)
                .bankrollSimulation(bankroll)
                .createdAt(System.currentTimeMillis())
                .auditMetadata(audit("backtest-run", "backtest-service", System.currentTimeMillis()))
                .build();
    }

    private static Summary summarize(List<LotteryBacktestReport.ReplayRow> rows) {
        Map<String, Integer> prizeDistribution = new LinkedHashMap<>();
        Map<String, Integer> hitDistribution = new LinkedHashMap<>();
        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalPrize = BigDecimal.ZERO;
        int redHits = 0;
        int blueHits = 0;
        int bestScore = 0;
        for (LotteryBacktestReport.ReplayRow row : rows) {
            prizeDistribution.put(row.getPrizeName(), prizeDistribution.getOrDefault(row.getPrizeName(), 0) + 1);
            String hitKey = String.valueOf(row.getRedHits() == null ? 0 : row.getRedHits());
            hitDistribution.put(hitKey, hitDistribution.getOrDefault(hitKey, 0) + 1);
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
        return new Summary(averageRedHits, blueHitRate, bestScore, totalCost, totalPrize, prizeDistribution, hitDistribution);
    }

    private static List<LotteryBacktestReport.ReplayRow> candidatePoolRows(List<LotteryBacktestReport.ReplayRow> rows,
                                                                           boolean decisionMode) {
        if (rows == null || rows.isEmpty()) {
            return List.of();
        }
        if (!decisionMode) {
            return List.of(rows.get(0));
        }
        String firstIssue = rows.get(0).getIssue();
        return rows.stream().filter(row -> Objects.equals(firstIssue, row.getIssue())).toList();
    }

    private static int maximumRedOverlap(List<LotteryBacktestReport.ReplayRow> rows) {
        int maximum = 0;
        for (int left = 0; left < rows.size(); left++) {
            Set<String> leftNumbers = new LinkedHashSet<>(rows.get(left).getPredictedRedNumbers());
            for (int right = left + 1; right < rows.size(); right++) {
                int overlap = (int) rows.get(right).getPredictedRedNumbers().stream().filter(leftNumbers::contains).count();
                maximum = Math.max(maximum, overlap);
            }
        }
        return maximum;
    }

    private static boolean sameWindow(List<LotteryBacktestReport.ReplayRow> rows,
                                      List<LotteryBacktestReport.ReplayRow> baselineRows) {
        if (rows.size() != baselineRows.size()) {
            return false;
        }
        for (int index = 0; index < rows.size(); index++) {
            if (!Objects.equals(rows.get(index).getIssue(), baselineRows.get(index).getIssue())) {
                return false;
            }
        }
        return true;
    }

    private static List<String> warnings(List<LotteryBacktestReport.ReplayRow> rows,
                                         LotteryDecisionSet decisionSet,
                                         int windowIssueCount,
                                         int candidateCount,
                                         BigDecimal candidateDiversity,
                                         BigDecimal averageRedHitsDelta,
                                         BigDecimal blueHitRateDelta,
                                         BigDecimal roiPercentDelta,
                                         boolean sameWindow,
                                         boolean sameBudget) {
        LinkedHashSet<String> warnings = new LinkedHashSet<>();
        if (decisionSet == null) {
            if (windowIssueCount == 0) {
                warnings.add("UNKNOWN_EVALUATION_WINDOW");
            }
            return new ArrayList<>(warnings);
        }
        warnings.add("STATIC_POOL_HISTORICAL_REPLAY");
        LotteryResearchProvenance provenance = decisionSet.getProvenance();
        if (windowIssueCount == 0) {
            warnings.add("UNKNOWN_EVALUATION_WINDOW");
        }
        if (provenance == null || !hasCorpusWindow(provenance)) {
            warnings.add("UNKNOWN_CORPUS_WINDOW");
        } else {
            List<String> issues = rows.stream()
                    .map(LotteryBacktestReport.ReplayRow::getIssue)
                    .filter(StringUtils::hasText)
                    .distinct()
                    .toList();
            if (issues.stream().anyMatch(issue -> within(issue, provenance.getTrainFirstIssue(), provenance.getTrainLatestIssue()))) {
                warnings.add("TRAIN_WINDOW_OVERLAP");
            }
            if (issues.stream().anyMatch(issue -> within(issue, provenance.getValidationFirstIssue(), provenance.getValidationLatestIssue()))) {
                warnings.add("VALIDATION_WINDOW_OVERLAP");
            }
        }
        if (windowIssueCount < DEFAULT_WINDOW) {
            warnings.add("SMALL_SAMPLE");
        }
        if (candidateCount < 2 || candidateDiversity.compareTo(new BigDecimal("100.00")) < 0) {
            warnings.add("LOW_CANDIDATE_DIVERSITY");
        }
        if (averageRedHitsDelta.compareTo(BigDecimal.ZERO) <= 0
                && blueHitRateDelta.compareTo(BigDecimal.ZERO) <= 0
                && roiPercentDelta.compareTo(BigDecimal.ZERO) <= 0) {
            warnings.add("NO_RANDOM_ADVANTAGE");
        }
        if (!sameWindow) {
            warnings.add("BASELINE_WINDOW_MISMATCH");
        }
        if (!sameBudget) {
            warnings.add("BASELINE_BUDGET_MISMATCH");
        }
        return new ArrayList<>(warnings);
    }

    private static boolean hasCorpusWindow(LotteryResearchProvenance provenance) {
        return StringUtils.hasText(provenance.getTrainFirstIssue())
                && StringUtils.hasText(provenance.getTrainLatestIssue())
                && StringUtils.hasText(provenance.getValidationFirstIssue())
                && StringUtils.hasText(provenance.getValidationLatestIssue());
    }

    private static boolean within(String issue, String firstIssue, String latestIssue) {
        return StringUtils.hasText(issue)
                && StringUtils.hasText(firstIssue)
                && StringUtils.hasText(latestIssue)
                && issue.compareTo(firstIssue) >= 0
                && issue.compareTo(latestIssue) <= 0;
    }

    private static long deriveBaselineSeed(long baseSeed, String issue, int slot, int attempt) {
        String source = baseSeed + "|" + issue + "|" + slot + "|" + attempt;
        long hash = 0xcbf29ce484222325L;
        for (int index = 0; index < source.length(); index++) {
            hash ^= source.charAt(index);
            hash *= 0x100000001b3L;
        }
        return hash;
    }

    private static BigDecimal roiPercent(BigDecimal netResult, BigDecimal totalCost) {
        if (netResult == null || totalCost == null || totalCost.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return netResult.multiply(new BigDecimal("100")).divide(totalCost, 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal ratePercent(int numerator, int denominator) {
        if (denominator <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(numerator * 100L).divide(BigDecimal.valueOf(denominator), 2, RoundingMode.HALF_UP);
    }

    private static String numberKey(List<String> redNumbers, String blueNumber) {
        return String.join("-", redNumbers == null ? List.of() : redNumbers) + "+" + firstText(blueNumber, "--");
    }

    private static String firstText(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private static LotteryResearchProvenance copyProvenance(LotteryResearchProvenance source) {
        if (source == null) {
            return null;
        }
        return LotteryResearchProvenance.builder()
                .sourceType(source.getSourceType())
                .generationId(source.getGenerationId())
                .batchId(source.getBatchId())
                .runId(source.getRunId())
                .runName(source.getRunName())
                .corpusVersion(source.getCorpusVersion())
                .trainSha256(source.getTrainSha256())
                .validationSha256(source.getValidationSha256())
                .checkpointSha256(source.getCheckpointSha256())
                .prompt(source.getPrompt())
                .maxNewTokens(source.getMaxNewTokens())
                .temperature(source.getTemperature())
                .topK(source.getTopK())
                .seed(source.getSeed())
                .strategyLabel(source.getStrategyLabel())
                .trainFirstIssue(source.getTrainFirstIssue())
                .trainLatestIssue(source.getTrainLatestIssue())
                .validationFirstIssue(source.getValidationFirstIssue())
                .validationLatestIssue(source.getValidationLatestIssue())
                .batchBaseSeed(source.getBatchBaseSeed())
                .batchMaxRedOverlap(source.getBatchMaxRedOverlap())
                .batchMinimumBlueCoverage(source.getBatchMinimumBlueCoverage())
                .batchMinimumBlueCoverageMet(source.getBatchMinimumBlueCoverageMet())
                .batchStrategies(source.getBatchStrategies() == null ? new ArrayList<>() : new ArrayList<>(source.getBatchStrategies()))
                .modelConfig(source.getModelConfig() == null ? new LinkedHashMap<>() : new LinkedHashMap<>(source.getModelConfig()))
                .capturedAt(source.getCapturedAt())
                .build();
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
                           Map<String, Integer> prizeDistribution,
                           Map<String, Integer> hitDistribution) {
    }
}
