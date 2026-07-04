package com.one.record.service.impl;

import com.one.record.lottery.LotteryExperimentRunRequest;
import com.one.record.lottery.LotteryExperimentUpdateRequest;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryStrategyExperiment;
import com.one.record.repository.LotteryStrategyExperimentRepository;
import com.one.record.service.ILotteryExperimentService;
import com.one.record.service.ILotteryTrainingService;
import com.one.record.training.LotteryPredictionCandidate;
import com.one.record.training.LotteryTrainingReport;
import com.one.record.training.PredictionRuleConfig;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@AllArgsConstructor
public class LotteryExperimentService implements ILotteryExperimentService {

    private static final int DEFAULT_PAGE_SIZE = 20;

    private static final int MAX_PAGE_SIZE = 100;

    private static final int DEFAULT_REPLAY_WINDOW = 30;

    private static final int MAX_REPLAY_WINDOW = 500;

    private final LotteryStrategyExperimentRepository repository;

    private final ILotteryTrainingService trainingService;

    @Override
    public LotteryStrategyExperiment runExperiment(LotteryExperimentRunRequest request) {
        LotteryExperimentRunRequest normalized = normalizeRequest(request);
        LotteryTrainingReport report = trainingService.train(normalized.getReplayWindow(), normalized.getScale());
        long now = System.currentTimeMillis();
        LotteryTrainingReport.TrainingResult best = report == null ? null : report.getBest();
        LotteryStrategyExperiment experiment = LotteryStrategyExperiment.builder()
                .strategyName(normalized.getStrategyName())
                .scale(normalized.getScale())
                .replayWindow(normalized.getReplayWindow())
                .inputSource(normalized.getInputSource())
                .bestRule(best == null ? null : best.getConfig())
                .outcomeSummary(best == null ? null : best.getSummary())
                .scoreDistribution(scoreDistribution(report))
                .generatedCandidates(generatedCandidates(report))
                .latestPrediction(report == null ? null : report.getLatestPrediction())
                .tags(normalized.getTags())
                .notes(normalized.getNotes())
                .createdAt(now)
                .updatedAt(now)
                .build();
        return repository.save(experiment);
    }

    @Override
    public LotteryPageResponse<LotteryStrategyExperiment> experiments(Integer page,
                                                                      Integer pageSize,
                                                                      String strategyName,
                                                                      String tag,
                                                                      Long createdStartAt,
                                                                      Long createdEndAt) {
        int safePage = normalizePage(page);
        int safePageSize = normalizePageSize(pageSize);
        String safeStrategyName = normalizeOptional(strategyName);
        String safeTag = normalizeOptional(tag);
        List<LotteryStrategyExperiment> filtered = repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .filter(item -> safeStrategyName == null || containsNormalized(item.getStrategyName(), safeStrategyName))
                .filter(item -> safeTag == null || hasTag(item, safeTag))
                .filter(item -> createdStartAt == null || item.getCreatedAt() != null && item.getCreatedAt() >= createdStartAt)
                .filter(item -> createdEndAt == null || item.getCreatedAt() != null && item.getCreatedAt() <= createdEndAt)
                .toList();
        return pageOf(filtered, safePage, safePageSize);
    }

    @Override
    public LotteryStrategyExperiment detail(String id) {
        if (!StringUtils.hasText(id)) {
            return null;
        }
        return repository.findById(id.trim()).orElse(null);
    }

    @Override
    public LotteryStrategyExperiment updateNotes(String id, LotteryExperimentUpdateRequest request) {
        LotteryStrategyExperiment experiment = detail(id);
        if (experiment == null) {
            return null;
        }
        experiment.setTags(normalizeTags(request == null ? null : request.getTags()));
        experiment.setNotes(trimToNull(request == null ? null : request.getNotes()));
        experiment.setUpdatedAt(System.currentTimeMillis());
        return repository.save(experiment);
    }

    private static LotteryExperimentRunRequest normalizeRequest(LotteryExperimentRunRequest request) {
        int replayWindow = request == null ? DEFAULT_REPLAY_WINDOW : normalizeReplayWindow(request.getReplayWindow());
        String scale = request == null ? null : request.getScale();
        String inputSource = request == null ? null : request.getInputSource();
        return LotteryExperimentRunRequest.builder()
                .strategyName(StringUtils.hasText(request == null ? null : request.getStrategyName())
                        ? request.getStrategyName().trim()
                        : "实验-" + replayWindow)
                .replayWindow(replayWindow)
                .scale(normalizeScale(scale))
                .inputSource(StringUtils.hasText(inputSource) ? inputSource.trim() : "training-service")
                .tags(normalizeTags(request == null ? null : request.getTags()))
                .notes(trimToNull(request == null ? null : request.getNotes()))
                .build();
    }

    private static int normalizeReplayWindow(Integer replayWindow) {
        if (replayWindow == null || replayWindow <= 0) {
            return DEFAULT_REPLAY_WINDOW;
        }
        return Math.min(replayWindow, MAX_REPLAY_WINDOW);
    }

    private static String normalizeScale(String scale) {
        if (!StringUtils.hasText(scale)) {
            return "standard";
        }
        String value = scale.trim().toLowerCase(Locale.ROOT);
        if ("fast".equals(value) || "standard".equals(value) || "deep".equals(value)) {
            return value;
        }
        return "standard";
    }

    private static List<String> normalizeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return List.of();
        }
        Set<String> normalized = new LinkedHashSet<>();
        for (String tag : tags) {
            if (StringUtils.hasText(tag)) {
                normalized.add(tag.trim());
            }
        }
        return new ArrayList<>(normalized);
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private static Map<String, Integer> scoreDistribution(LotteryTrainingReport report) {
        Map<String, Integer> distribution = new LinkedHashMap<>();
        if (report == null || report.getCandidates() == null) {
            return distribution;
        }
        for (LotteryTrainingReport.TrainingResult candidate : report.getCandidates()) {
            PredictionRuleConfig config = candidate == null ? null : candidate.getConfig();
            String key = config == null || !StringUtils.hasText(config.getName()) ? "unknown" : config.getName();
            distribution.put(key, candidate == null ? 0 : candidate.getRankScore());
        }
        return distribution;
    }

    private static List<LotteryPredictionCandidate> generatedCandidates(LotteryTrainingReport report) {
        if (report == null || report.getLatestPrediction() == null || report.getLatestPrediction().getCandidates() == null) {
            return List.of();
        }
        return report.getLatestPrediction().getCandidates();
    }

    private static int normalizePage(Integer page) {
        if (page == null || page < 0) {
            return 0;
        }
        return page;
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

    private static boolean hasTag(LotteryStrategyExperiment item, String expectedUppercase) {
        return item.getTags() != null && item.getTags().stream()
                .filter(StringUtils::hasText)
                .map(tag -> tag.trim().toUpperCase(Locale.ROOT))
                .anyMatch(tag -> tag.equals(expectedUppercase));
    }

    private static LotteryPageResponse<LotteryStrategyExperiment> pageOf(List<LotteryStrategyExperiment> items,
                                                                         int page,
                                                                         int pageSize) {
        List<LotteryStrategyExperiment> sorted = items == null ? List.of() : items.stream()
                .sorted(Comparator.comparing(LotteryStrategyExperiment::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
        int total = sorted.size();
        int from = Math.min(page * pageSize, total);
        int to = Math.min(from + pageSize, total);
        return LotteryPageResponse.<LotteryStrategyExperiment>builder()
                .items(sorted.subList(from, to))
                .page(page)
                .pageSize(pageSize)
                .total((long) total)
                .hasNext(to < total)
                .build();
    }
}
