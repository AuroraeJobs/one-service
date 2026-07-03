package com.one.record.service.impl;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import com.one.common.util.JsonUtil;
import com.one.record.file.RecordFile;
import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.repository.LotteryPredictionSnapshotRepository;
import com.one.record.service.ILotteryTrainingService;
import com.one.record.training.LotteryActualRecord;
import com.one.record.training.LotteryLatestPrediction;
import com.one.record.training.LotteryPredictionCandidate;
import com.one.record.training.LotteryPredictionResult;
import com.one.record.training.LotteryTrainingReport;
import com.one.record.training.LotteryTrainingStatus;
import com.one.record.training.PredictionRuleConfig;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;
import java.util.stream.Collectors;

@Slf4j
@Component
public class LotteryTrainingService implements ILotteryTrainingService {

    private static final int SEARCH_RED_POOL_SIZE = 16;

    private static final int SEARCH_PREDICTION_LIMIT = 8;

    private static final String BEST_RULE_KEY = "lottery:rule:best";

    private static final String LAST_REPORT_KEY = "lottery:training:last";

    private static final String LATEST_PREDICTION_KEY = "lottery:prediction:latest";

    private static final String TRAINING_TIMELINE_KEY = "lottery:training:timeline";

    private static final String LATEST_ACTUAL_RECORD_KEY = "lottery:actual:latest";

    private static final String TRAINING_GENERATION_KEY = "lottery:training:generation";

    private static final int DEFAULT_PREDICTION_HISTORY_LIMIT = 20;

    private static final int MAX_PREDICTION_HISTORY_LIMIT = 100;

    private final StringRedisTemplate redisTemplate;

    private final LotteryPredictionSnapshotRepository predictionSnapshotRepository;

    private final AtomicBoolean trainingRunning = new AtomicBoolean(false);

    private final AtomicReference<LotteryTrainingStatus> trainingStatus = new AtomicReference<>(idleStatus());

    public LotteryTrainingService(StringRedisTemplate redisTemplate,
                                  LotteryPredictionSnapshotRepository predictionSnapshotRepository) {
        this.redisTemplate = redisTemplate;
        this.predictionSnapshotRepository = predictionSnapshotRepository;
    }

    @Override
    public LotteryTrainingReport train(int replayCount, String scale) {
        return trainInternal(replayCount, scale, status -> {
        });
    }

    @Override
    public LotteryTrainingStatus startTraining(int replayCount, String scale) {
        if (!trainingRunning.compareAndSet(false, true)) {
            return trainingStatus.get();
        }
        updateStatus(true, false, 1, "准备训练", 0, 0, "训练任务已启动", null);
        CompletableFuture.runAsync(() -> {
            try {
                LotteryTrainingReport report = trainInternal(replayCount, scale, trainingStatus::set);
                updateStatus(false, false, 100, "训练完成", report.getReplayCount(), report.getReplayCount(),
                        "训练完成，已生成最新预测", report);
            } catch (RuntimeException exception) {
                log.error("彩票训练失败", exception);
                updateStatus(false, true, 100, "训练失败", 0, 0, exception.getMessage(), null);
            } finally {
                trainingRunning.set(false);
            }
        });
        return trainingStatus.get();
    }

    @Override
    public LotteryTrainingStatus trainingStatus() {
        return trainingStatus.get();
    }

    private LotteryTrainingReport trainInternal(int replayCount, String scale, Consumer<LotteryTrainingStatus> progressUpdater) {
        String safeScale = safeScale(scale);
        int generation = nextGeneration();
        List<Draw> draws = parseRecords();
        int safeReplayCount = safeReplayCount(replayCount, safeScale, draws.size());
        List<PredictionRuleConfig> configs = buildTrainingConfigs(safeScale);
        PredictionRuleConfig previousBest = bestRule();
        configs.addAll(buildExplorationConfigs(previousBest, generation, safeScale));
        List<LotteryTrainingReport.TrainingResult> candidateResults = new ArrayList<>();
        for (int index = 0; index < configs.size(); index++) {
            PredictionRuleConfig config = configs.get(index);
            progressUpdater.accept(buildStatus(true, false,
                    percent(index, configs.size(), 8, 58),
                    "候选规则回放评分", index, configs.size(),
                    "第 " + generation + " 代正在回放 " + config.getName(), null));
            candidateResults.add(trainConfig(draws, config, safeReplayCount));
        }
        List<LotteryTrainingReport.TrainingResult> candidates = candidateResults.stream()
                .sorted(Comparator
                        .comparingInt(LotteryTrainingReport.TrainingResult::getRankScore).reversed()
                        .thenComparing(result -> result.getSummary().getAverageScore(), Comparator.reverseOrder())
                        .thenComparing(result -> result.getSummary().getAverageRedHits(), Comparator.reverseOrder()))
                .limit(8)
                .collect(Collectors.toList());

        LotteryTrainingReport report = new LotteryTrainingReport();
        report.setReplayCount(safeReplayCount);
        report.setGeneration(generation);
        report.setCandidates(candidates);
        if (!candidates.isEmpty()) {
            LotteryTrainingReport.TrainingResult best = candidates.get(0);
            report.setBest(best);
            RollingTrainingResult rolling = buildTrainingTimeline(draws, best.getConfig(), safeReplayCount, progressUpdater);
            LotteryActualRecord actualRecord = latestActualRecord();
            PredictionRuleConfig learnedRule = rolling.getFinalConfig();
            report.setActualRecord(actualRecord);
            if (actualRecord != null) {
                progressUpdater.accept(buildStatus(true, false, 95, "目标记录反馈",
                        safeReplayCount, safeReplayCount, "正在根据最新中奖记录微调规则", null));
                learnedRule = refineRuleWithActual(draws, learnedRule, actualRecord);
            }
            report.setLearnedRule(learnedRule);
            report.setTimeline(rolling.getTimeline());
            saveJson(BEST_RULE_KEY, learnedRule);
            saveJson(TRAINING_TIMELINE_KEY, rolling.getTimeline());
            progressUpdater.accept(buildStatus(true, false, 96, "生成最新预测",
                    safeReplayCount, safeReplayCount, "正在生成下一期预测", null));
            LotteryLatestPrediction latestPrediction = buildLatestPrediction(draws, learnedRule);
            report.setLatestPrediction(latestPrediction);
            saveJson(LATEST_PREDICTION_KEY, latestPrediction);
            savePredictionSnapshot(latestPrediction);
        }
        saveJson(LAST_REPORT_KEY, report);
        return report;
    }

    @Override
    public PredictionRuleConfig bestRule() {
        PredictionRuleConfig config = readJson(BEST_RULE_KEY, PredictionRuleConfig.class);
        return normalizeConfig(config == null ? PredictionRuleConfig.defaultConfig() : config);
    }

    @Override
    public LotteryLatestPrediction latestPrediction() {
        LotteryLatestPrediction cached = readJson(LATEST_PREDICTION_KEY, LotteryLatestPrediction.class);
        if (cached != null) {
            return cached;
        }
        return buildLatestPrediction(parseRecords(), bestRule());
    }

    @Override
    public LotteryActualRecord latestActualRecord() {
        return readJson(LATEST_ACTUAL_RECORD_KEY, LotteryActualRecord.class);
    }

    @Override
    public LotteryActualRecord saveLatestActualRecord(LotteryActualRecord record) {
        LotteryActualRecord normalized = normalizeActualRecord(record);
        saveJson(LATEST_ACTUAL_RECORD_KEY, normalized);
        LotteryLatestPrediction prediction = readJson(LATEST_PREDICTION_KEY, LotteryLatestPrediction.class);
        if (prediction != null) {
            attachActualScore(prediction, normalized);
            saveJson(LATEST_PREDICTION_KEY, prediction);
        }
        return normalized;
    }

    @Override
    public List<LotteryPredictionSnapshot> predictionHistory(Integer limit) {
        return predictionSnapshotRepository.findByOrderByCreatedAtDesc(PageRequest.of(0, normalizePredictionHistoryLimit(limit)));
    }

    @Override
    public LotteryPredictionSnapshot predictionDetail(String id) {
        if (id == null || id.trim().isEmpty()) {
            return null;
        }
        return predictionSnapshotRepository.findById(id.trim()).orElse(null);
    }

    @Override
    public LotteryPredictionSnapshot attachPredictionActual(String id, LotteryActualRecord record) {
        LotteryPredictionSnapshot snapshot = predictionDetail(id);
        if (snapshot == null) {
            return null;
        }
        LotteryActualRecord normalized = normalizeActualRecord(record);
        snapshot.setActualRecord(normalized);
        snapshot.setResult(scorePrediction(snapshot.getRedNumbers(), snapshot.getBlueNumber(), normalized));
        if (snapshot.getCandidates() != null) {
            for (LotteryPredictionCandidate candidate : snapshot.getCandidates()) {
                candidate.setResult(scorePrediction(candidate.getRedNumbers(), candidate.getBlueNumber(), normalized));
            }
        }
        snapshot.setUpdatedAt(System.currentTimeMillis());
        return predictionSnapshotRepository.save(snapshot);
    }

    LotteryPredictionSnapshot savePredictionSnapshot(LotteryLatestPrediction prediction) {
        if (prediction == null) {
            return null;
        }
        long now = System.currentTimeMillis();
        LotteryPredictionSnapshot snapshot = LotteryPredictionSnapshot.builder()
                .title(prediction.getTitle())
                .redNumbers(new ArrayList<>(prediction.getRedNumbers()))
                .blueNumber(prediction.getBlueNumber())
                .score(prediction.getScore())
                .ruleId(prediction.getRuleId())
                .ruleName(prediction.getRuleName())
                .basedOnPeriod(prediction.getBasedOnPeriod())
                .targetPeriod(prediction.getTargetPeriod())
                .reason(prediction.getReason())
                .actualRecord(prediction.getActualRecord())
                .result(prediction.getResult())
                .candidates(new ArrayList<>(prediction.getCandidates()))
                .createdAt(now)
                .updatedAt(now)
                .build();
        return predictionSnapshotRepository.save(snapshot);
    }

    private LotteryLatestPrediction buildLatestPrediction(List<Draw> draws, PredictionRuleConfig config) {
        if (draws.isEmpty()) {
            return null;
        }
        List<Prediction> predictions = predict(draws, config).stream()
                .sorted(Comparator.comparingInt(Prediction::getScore).reversed()
                        .thenComparing(Prediction::getTitle))
                .collect(Collectors.toList());
        if (predictions.isEmpty()) {
            return null;
        }
        Prediction prediction = predictions.get(0);
        Draw latestDraw = draws.get(draws.size() - 1);
        LotteryLatestPrediction latestPrediction = new LotteryLatestPrediction();
        latestPrediction.setTitle(prediction.getTitle());
        latestPrediction.setRedNumbers(prediction.getRedNumbers());
        latestPrediction.setBlueNumber(prediction.getBlueNumber());
        latestPrediction.setScore(prediction.getScore());
        latestPrediction.setRuleId(config.getId());
        latestPrediction.setRuleName(config.getName());
        latestPrediction.setBasedOnPeriod(latestDraw.getPeriod());
        latestPrediction.setTargetPeriod(latestDraw.getPeriod() + 1);
        latestPrediction.setReason("训练完成后使用当前最优规则重新预测，依据前 "
                + latestDraw.getPeriod() + " 期历史数据生成。");
        LotteryActualRecord actualRecord = latestActualRecord();
        attachActualScore(latestPrediction, actualRecord);
        latestPrediction.setCandidates(predictions.stream()
                .limit(6)
                .map(candidate -> toPredictionCandidate(candidate, actualRecord))
                .collect(Collectors.toList()));
        return latestPrediction;
    }

    private LotteryPredictionCandidate toPredictionCandidate(Prediction prediction, LotteryActualRecord actualRecord) {
        LotteryPredictionCandidate candidate = new LotteryPredictionCandidate();
        candidate.setTitle(prediction.getTitle());
        candidate.setRedNumbers(prediction.getRedNumbers());
        candidate.setBlueNumber(prediction.getBlueNumber());
        candidate.setScore(prediction.getScore());
        if (actualRecord != null) {
            candidate.setResult(scorePrediction(prediction.getRedNumbers(), prediction.getBlueNumber(), actualRecord));
        }
        return candidate;
    }

    private void attachActualScore(LotteryLatestPrediction prediction, LotteryActualRecord actualRecord) {
        if (prediction == null || actualRecord == null || actualRecord.getRedNumbers() == null
                || actualRecord.getRedNumbers().isEmpty() || actualRecord.getBlueNumber() == null) {
            return;
        }
        LotteryPredictionResult result = scorePrediction(prediction.getRedNumbers(), prediction.getBlueNumber(), actualRecord);
        prediction.setActualRecord(actualRecord);
        prediction.setResult(result);
    }

    private LotteryPredictionResult scorePrediction(List<String> redNumbers, String blueNumber, LotteryActualRecord actualRecord) {
        int redHits = (int) redNumbers.stream().filter(actualRecord.getRedNumbers()::contains).count();
        boolean blueHit = blueNumber.equals(actualRecord.getBlueNumber());
        LotteryPredictionResult result = new LotteryPredictionResult();
        result.setRedHits(redHits);
        result.setBlueHit(blueHit);
        result.setPrizeName(prize(redHits, blueHit));
        result.setScore(redHits * 12 + (blueHit ? 10 : 0));
        return result;
    }

    private LotteryActualRecord normalizeActualRecord(LotteryActualRecord record) {
        if (record == null) {
            throw new IllegalArgumentException("中奖记录不能为空");
        }
        if (record.getRedNumbers() == null || record.getRedNumbers().size() != 6) {
            throw new IllegalArgumentException("红球必须是 6 个号码");
        }
        List<String> redNumbers = record.getRedNumbers().stream()
                .map(this::normalizeNumber)
                .distinct()
                .sorted(Comparator.comparingInt(Integer::parseInt))
                .collect(Collectors.toList());
        if (redNumbers.size() != 6 || redNumbers.stream().anyMatch(number -> Integer.parseInt(number) < 1 || Integer.parseInt(number) > 33)) {
            throw new IllegalArgumentException("红球范围必须是 01-33，且不能重复");
        }
        String blueNumber = normalizeNumber(record.getBlueNumber());
        int blue = Integer.parseInt(blueNumber);
        if (blue < 1 || blue > 16) {
            throw new IllegalArgumentException("蓝球范围必须是 01-16");
        }
        LotteryActualRecord normalized = new LotteryActualRecord();
        normalized.setPeriod(record.getPeriod());
        normalized.setRedNumbers(redNumbers);
        normalized.setBlueNumber(blueNumber);
        return normalized;
    }

    private String normalizeNumber(String value) {
        if (value == null || !value.trim().matches("\\d{1,2}")) {
            throw new IllegalArgumentException("号码格式不正确");
        }
        return String.format("%02d", Integer.parseInt(value.trim()));
    }

    private static int normalizePredictionHistoryLimit(Integer limit) {
        if (limit == null || limit <= 0) {
            return DEFAULT_PREDICTION_HISTORY_LIMIT;
        }
        return Math.min(limit, MAX_PREDICTION_HISTORY_LIMIT);
    }

    private void saveJson(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, JsonUtil.toJson(value));
        } catch (RuntimeException exception) {
            log.warn("彩票训练结果序列化或写入 Redis 失败，key={}", key, exception);
        }
    }

    private int nextGeneration() {
        try {
            Long generation = redisTemplate.opsForValue().increment(TRAINING_GENERATION_KEY);
            return generation == null ? 1 : generation.intValue();
        } catch (RuntimeException exception) {
            log.warn("训练代数递增失败，使用本地临时代数", exception);
            return (int) (System.currentTimeMillis() % 100000);
        }
    }

    private <T> T readJson(String key, Class<T> type) {
        try {
            String value = redisTemplate.opsForValue().get(key);
            return value == null ? null : JsonUtil.toObject(value, type);
        } catch (RuntimeException exception) {
            log.warn("彩票训练结果读取或反序列化失败，key={}", key, exception);
        }
        return null;
    }

    private LotteryTrainingReport.TrainingResult trainConfig(List<Draw> draws, PredictionRuleConfig config, int replayCount) {
        int start = Math.max(20, draws.size() - replayCount);
        List<ScoredPrediction> bestPredictions = new ArrayList<>();
        for (int index = start; index < draws.size(); index++) {
            Draw target = draws.get(index);
            List<Draw> trainingDraws = draws.subList(0, target.getPeriod() - 1);
            Prediction selected = predict(trainingDraws, config).stream()
                    .max(Comparator.comparingInt(Prediction::getScore))
                    .orElse(null);
            if (selected != null) {
                bestPredictions.add(score(selected, target));
            }
        }

        LotteryTrainingReport.TrainingResult result = new LotteryTrainingReport.TrainingResult();
        result.setConfig(config);
        result.setSummary(buildSummary(bestPredictions));
        result.setRankScore(rankScore(result.getSummary()));
        return result;
    }

    private RollingTrainingResult buildTrainingTimeline(List<Draw> draws, PredictionRuleConfig baseConfig, int replayCount,
                                                        Consumer<LotteryTrainingStatus> progressUpdater) {
        int start = Math.max(20, draws.size() - replayCount);
        PredictionRuleConfig currentConfig = copyConfig(baseConfig);
        currentConfig.setId(baseConfig.getId() + "-learned");
        currentConfig.setName(baseConfig.getName() + " 滚动学习");
        List<LotteryTrainingReport.TrainingTimelineItem> timeline = new ArrayList<>();

        for (int index = start; index < draws.size(); index++) {
            Draw target = draws.get(index);
            int processed = index - start + 1;
            progressUpdater.accept(buildStatus(true, false,
                    percent(processed, replayCount, 58, 95),
                    "逐期滚动调参", processed, replayCount,
                    "正在基于前 " + (target.getPeriod() - 1) + " 期预测第 " + target.getPeriod() + " 期",
                    null));
            List<Draw> trainingDraws = draws.subList(0, target.getPeriod() - 1);
            Prediction prediction = predict(trainingDraws, currentConfig).stream()
                    .max(Comparator.comparingInt(Prediction::getScore))
                    .orElse(null);
            if (prediction == null) {
                continue;
            }

            PredictionRuleConfig beforeConfig = copyConfig(currentConfig);
            ScoredPrediction scored = score(prediction, target);
            String adjustment = adjustRule(currentConfig, scored.getResult());

            LotteryTrainingReport.TrainingTimelineItem item = new LotteryTrainingReport.TrainingTimelineItem();
            item.setPeriod(target.getPeriod());
            item.setPredictedRedNumbers(prediction.getRedNumbers());
            item.setPredictedBlueNumber(prediction.getBlueNumber());
            item.setActualRedNumbers(target.getRedNumbers());
            item.setActualBlueNumber(target.getBlueNumber());
            item.setRedHits(scored.getResult().getRedHits());
            item.setBlueHit(scored.getResult().isBlueHit());
            item.setPrizeName(scored.getResult().getPrizeName());
            item.setScore(scored.getResult().getScore());
            item.setStrategy(prediction.getTitle());
            item.setBeforeRuleName(beforeConfig.getName());
            item.setAfterRuleName(currentConfig.getName());
            item.setAdjustment(adjustment);
            timeline.add(item);
        }

        RollingTrainingResult result = new RollingTrainingResult();
        result.setTimeline(timeline);
        result.setFinalConfig(currentConfig);
        return result;
    }

    private PredictionRuleConfig refineRuleWithActual(List<Draw> draws, PredictionRuleConfig baseConfig, LotteryActualRecord actualRecord) {
        if (draws.isEmpty() || actualRecord == null) {
            return baseConfig;
        }
        return buildActualFeedbackConfigs(baseConfig).stream()
                .max(Comparator
                        .comparingInt((PredictionRuleConfig config) -> targetScore(draws, config, actualRecord))
                        .thenComparingDouble(config -> predict(draws, config).stream()
                                .mapToInt(Prediction::getScore)
                                .max()
                                .orElse(0)))
                .map(config -> {
                    config.setId(config.getId() + "-target");
                    config.setName(config.getName() + " 目标反馈");
                    return config;
                })
                .orElse(baseConfig);
    }

    private List<PredictionRuleConfig> buildActualFeedbackConfigs(PredictionRuleConfig baseConfig) {
        List<PredictionRuleConfig> configs = new ArrayList<>();
        double[] averageDiffSteps = new double[]{-0.2, 0, 0.2};
        double[] squaredDiffSteps = new double[]{-0.2, 0, 0.2};
        double[] oddEvenSteps = new double[]{-0.2, 0, 0.2};
        double[] omissionSteps = new double[]{-0.2, 0, 0.2};
        for (double averageDiffStep : averageDiffSteps) {
            for (double squaredDiffStep : squaredDiffSteps) {
                for (double oddEvenStep : oddEvenSteps) {
                    for (double omissionStep : omissionSteps) {
                        PredictionRuleConfig config = copyConfig(baseConfig);
                        config.setAverageDiffWeight(clamp(config.getAverageDiffWeight() + averageDiffStep, 0.6, 2.4));
                        config.setSquaredDiffWeight(clamp(config.getSquaredDiffWeight() + squaredDiffStep, 0.6, 2.4));
                        config.setOddEvenProbabilityWeight(clamp(config.getOddEvenProbabilityWeight() + oddEvenStep, 0.6, 2.4));
                        config.setOmissionWeight(clamp(config.getOmissionWeight() + omissionStep, 0.6, 2.4));
                        configs.add(config);
                    }
                }
            }
        }
        return configs;
    }

    private int targetScore(List<Draw> draws, PredictionRuleConfig config, LotteryActualRecord actualRecord) {
        Prediction prediction = predict(draws, config).stream()
                .max(Comparator.comparingInt(Prediction::getScore))
                .orElse(null);
        if (prediction == null) {
            return 0;
        }
        int redHits = (int) prediction.getRedNumbers().stream().filter(actualRecord.getRedNumbers()::contains).count();
        boolean blueHit = prediction.getBlueNumber().equals(actualRecord.getBlueNumber());
        int structureBonus = structureSimilarity(prediction.getRedNumbers(), actualRecord.getRedNumbers());
        return redHits * 120 + (blueHit ? 80 : 0) + structureBonus + prediction.getScore();
    }

    private int structureSimilarity(List<String> predictedRedNumbers, List<String> actualRedNumbers) {
        Profile predicted = profile(predictedRedNumbers);
        Profile actual = profile(actualRedNumbers);
        int oddSimilarity = 6 - Math.abs(predicted.getOddCount() - actual.getOddCount());
        int bigSimilarity = 6 - Math.abs(predicted.getBigCount() - actual.getBigCount());
        int sumSimilarity = Math.max(0, 20 - Math.abs(sum(predictedRedNumbers) - sum(actualRedNumbers)) / 3);
        return oddSimilarity * 4 + bigSimilarity * 4 + sumSimilarity;
    }

    private static LotteryTrainingStatus idleStatus() {
        LotteryTrainingStatus status = new LotteryTrainingStatus();
        status.setRunning(false);
        status.setFailed(false);
        status.setPercent(0);
        status.setStage("未开始");
        status.setMessage("点击开始训练");
        return status;
    }

    private void updateStatus(boolean running, boolean failed, int percent, String stage,
                              int processed, int total, String message, LotteryTrainingReport report) {
        trainingStatus.set(buildStatus(running, failed, percent, stage, processed, total, message, report));
    }

    private LotteryTrainingStatus buildStatus(boolean running, boolean failed, int percent, String stage,
                                              int processed, int total, String message, LotteryTrainingReport report) {
        LotteryTrainingStatus status = new LotteryTrainingStatus();
        status.setRunning(running);
        status.setFailed(failed);
        status.setPercent(percent);
        status.setStage(stage);
        status.setProcessed(processed);
        status.setTotal(total);
        status.setMessage(message);
        status.setReport(report);
        return status;
    }

    private int percent(int processed, int total, int start, int end) {
        if (total <= 0) {
            return start;
        }
        double ratio = Math.max(0, Math.min(1, (double) processed / total));
        return (int) Math.round(start + (end - start) * ratio);
    }

    private String adjustRule(PredictionRuleConfig config, PredictionScore score) {
        double oldActive = config.getActiveWeight();
        double oldOmission = config.getOmissionWeight();
        double oldBalanced = config.getBalancedWeight();
        double oldBlue = config.getBlueOmissionWeight();
        double oldAverageDiff = config.getAverageDiffWeight();
        double oldSquaredDiff = config.getSquaredDiffWeight();
        double oldOddEven = config.getOddEvenProbabilityWeight();

        if (score.getRedHits() >= 3) {
            config.setActiveWeight(clamp(oldActive + 0.05, 0.6, 2.4));
            config.setBalancedWeight(clamp(oldBalanced + 0.05, 0.6, 2.4));
            config.setAverageDiffWeight(clamp(oldAverageDiff - 0.03, 0.6, 2.4));
            config.setSquaredDiffWeight(clamp(oldSquaredDiff - 0.03, 0.6, 2.4));
        } else {
            config.setActiveWeight(clamp(oldActive - 0.05, 0.6, 2.4));
            config.setOmissionWeight(clamp(oldOmission + 0.08, 0.6, 2.4));
            config.setBalancedWeight(clamp(oldBalanced + 0.04, 0.6, 2.4));
            config.setAverageDiffWeight(clamp(oldAverageDiff + 0.05, 0.6, 2.4));
            config.setSquaredDiffWeight(clamp(oldSquaredDiff + 0.05, 0.6, 2.4));
            config.setOddEvenProbabilityWeight(clamp(oldOddEven + 0.04, 0.6, 2.4));
        }
        if (score.isBlueHit()) {
            config.setBlueOmissionWeight(clamp(oldBlue - 0.03, 0.6, 2.4));
        } else {
            config.setBlueOmissionWeight(clamp(oldBlue + 0.05, 0.6, 2.4));
        }
        config.setName("滚动学习 热" + config.getActiveWeight()
                + " 遗" + config.getOmissionWeight()
                + " 均" + config.getBalancedWeight()
                + " 方" + config.getSquaredDiffWeight()
                + " 奇" + config.getOddEvenProbabilityWeight()
                + " 蓝" + config.getBlueOmissionWeight());
        return "红球" + score.getRedHits() + "个，" + (score.isBlueHit() ? "蓝球命中" : "蓝球未中")
                + "，调整为热" + config.getActiveWeight()
                + " 遗" + config.getOmissionWeight()
                + " 均" + config.getBalancedWeight()
                + " 方" + config.getSquaredDiffWeight()
                + " 奇" + config.getOddEvenProbabilityWeight()
                + " 蓝" + config.getBlueOmissionWeight();
    }

    private LotteryTrainingReport.TrainingSummary buildSummary(List<ScoredPrediction> predictions) {
        LotteryTrainingReport.TrainingSummary summary = new LotteryTrainingReport.TrainingSummary();
        if (predictions.isEmpty()) {
            summary.getImprovementTips().add("历史期数不足，暂时无法训练。");
            return summary;
        }

        int totalScore = 0;
        int totalRedHits = 0;
        int blueHits = 0;
        int bestScore = 0;
        Map<String, Integer> prizeDistribution = new LinkedHashMap<>();
        Map<String, int[]> strategyScores = new LinkedHashMap<>();

        for (ScoredPrediction prediction : predictions) {
            PredictionScore score = prediction.getResult();
            totalScore += score.getScore();
            totalRedHits += score.getRedHits();
            if (score.isBlueHit()) {
                blueHits++;
            }
            bestScore = Math.max(bestScore, score.getScore());
            prizeDistribution.put(score.getPrizeName(), prizeDistribution.getOrDefault(score.getPrizeName(), 0) + 1);
            int[] strategy = strategyScores.computeIfAbsent(prediction.getTitle(), key -> new int[]{0, 0});
            strategy[0]++;
            strategy[1] += score.getScore();
        }

        summary.setTotal(predictions.size());
        summary.setAverageScore(roundOne((double) totalScore / predictions.size()));
        summary.setBestScore(bestScore);
        summary.setAverageRedHits(roundOne((double) totalRedHits / predictions.size()));
        summary.setBlueHitRate((int) Math.round((double) blueHits / predictions.size() * 100));
        summary.setPrizeDistribution(prizeDistribution);
        strategyScores.entrySet().stream()
                .max(Comparator.comparingDouble(entry -> (double) entry.getValue()[1] / entry.getValue()[0]))
                .ifPresent(entry -> summary.setBestStrategy(entry.getKey()));
        if (summary.getBestStrategy() != null) {
            summary.getImprovementTips().add(summary.getBestStrategy() + " 当前窗口表现最好，可提高该策略权重。");
        }
        if (summary.getAverageRedHits() < 2) {
            summary.getImprovementTips().add("红球平均命中偏低，应增加结构和遗漏约束。");
        }
        if (summary.getBlueHitRate() < 15) {
            summary.getImprovementTips().add("蓝球命中率偏低，应降低单一遗漏规则依赖。");
        }
        return summary;
    }

    private int rankScore(LotteryTrainingReport.TrainingSummary summary) {
        int notWin = summary.getPrizeDistribution().getOrDefault("未中奖", 0);
        int winningCount = summary.getTotal() - notWin;
        int highPrizeCount = Arrays.asList("一等奖", "二等奖", "三等奖", "四等奖", "五等奖").stream()
                .mapToInt(prize -> summary.getPrizeDistribution().getOrDefault(prize, 0))
                .sum();
        return (int) Math.round(winningCount * 120 + highPrizeCount * 40
                + summary.getAverageScore() * 6 + summary.getAverageRedHits() * 30 + summary.getBlueHitRate() * 2);
    }

    private List<Prediction> predict(List<Draw> draws, PredictionRuleConfig config) {
        Pools pools = buildPools(draws, config);
        List<String> activeRed = pools.getActiveRed();
        List<String> overdueRed = pools.getOverdueRed();
        List<String> balancedRed = pools.getBalancedRed();
        List<String> fallback = pools.getRedFrequency().stream()
                .filter(item -> item.getCount() > 0)
                .map(FrequencyItem::getNumber)
                .collect(Collectors.toList());
        List<String> blueFocus = pools.getBlueFocus();
        int recentWindow = Math.min(config.getRecentWindow(), draws.size());
        double targetAverage = draws.subList(draws.size() - recentWindow, draws.size()).stream()
                .mapToInt(Draw::getRedSum)
                .average()
                .orElse(100);

        List<Prediction> predictions = new ArrayList<>();
        predictions.add(buildPrediction("综合推荐", concat(activeRed, 2, overdueRed, 2, balancedRed, 4),
                0, activeRed, overdueRed, balancedRed, fallback, blueFocus, pools, targetAverage, config, draws));
        predictions.add(buildPrediction("回补优先", concat(overdueRed, 4, balancedRed, 3, activeRed, 1),
                1, activeRed, overdueRed, balancedRed, fallback, blueFocus, pools, targetAverage, config, draws));
        predictions.add(buildPrediction("稳态结构", concat(balancedRed, 4, activeRed, 3, overdueRed, 2),
                2, activeRed, overdueRed, balancedRed, fallback, blueFocus, pools, targetAverage, config, draws));
        predictions.addAll(buildSearchPredictions(activeRed, overdueRed, balancedRed, fallback, pools,
                targetAverage, config, draws));
        return diversePredictions(predictions).stream()
                .sorted(Comparator.comparingInt(Prediction::getScore).reversed()
                        .thenComparing(Prediction::getTitle))
                .limit(SEARCH_PREDICTION_LIMIT)
                .collect(Collectors.toList());
    }

    private Prediction buildPrediction(String title, List<String> seeds, int blueIndex, List<String> activeRed,
                                       List<String> overdueRed, List<String> balancedRed, List<String> fallback,
                                       List<String> blueFocus, Pools pools, double targetAverage,
                                       PredictionRuleConfig config, List<Draw> draws) {
        List<String> redNumbers = completeRedNumbers(seeds, unique(activeRed, overdueRed, balancedRed, fallback),
                pools.getRedFrequency(), pools.getRedOmissions(), targetAverage, config, draws.get(draws.size() - 1));
        Prediction prediction = new Prediction();
        prediction.setTitle(title);
        prediction.setRedNumbers(redNumbers);
        prediction.setBlueNumber(selectBlueNumber(blueIndex, blueFocus, pools, config));
        prediction.setScore(predictionScore(redNumbers, prediction.getBlueNumber(), pools, targetAverage, config, draws));
        return prediction;
    }

    private List<Prediction> buildSearchPredictions(List<String> activeRed, List<String> overdueRed, List<String> balancedRed,
                                                    List<String> fallback, Pools pools, double targetAverage,
                                                    PredictionRuleConfig config, List<Draw> draws) {
        List<String> searchPool = unique(activeRed, balancedRed, overdueRed, fallback, createNumbers(33)).stream()
                .filter(number -> !config.isAvoidLastDraw() || !draws.get(draws.size() - 1).getRedNumbers().contains(number))
                .sorted(Comparator
                        .comparingDouble((String number) -> numberScore(number, pools.getRedFrequency(),
                                pools.getRedOmissions(), targetAverage, config)).reversed()
                        .thenComparing(number -> Integer.valueOf(number)))
                .limit(SEARCH_RED_POOL_SIZE)
                .collect(Collectors.toList());

        List<List<String>> combinations = new ArrayList<>();
        collectCombinations(searchPool, 0, new ArrayList<>(), combinations);
        List<List<String>> selected = combinations.stream()
                .filter(numbers -> validPredictionProfile(numbers, config))
                .sorted(Comparator
                        .comparingDouble((List<String> numbers) -> combinationSearchScore(numbers, pools, targetAverage, config, draws)).reversed()
                        .thenComparing(numbers -> numbers.stream().collect(Collectors.joining(""))))
                .collect(Collectors.toList());

        List<List<String>> diverse = new ArrayList<>();
        for (List<String> numbers : selected) {
            if (diverse.size() >= 5) {
                break;
            }
            boolean tooSimilar = diverse.stream().anyMatch(existing -> overlap(existing, numbers) >= 5);
            if (!tooSimilar) {
                List<String> sorted = new ArrayList<>(numbers);
                sorted.sort(Comparator.comparingInt(Integer::parseInt));
                diverse.add(sorted);
            }
        }

        List<Prediction> predictions = new ArrayList<>();
        for (int index = 0; index < diverse.size(); index++) {
            List<String> redNumbers = diverse.get(index);
            String blueNumber = selectBlueNumber(index + 3, pools.getBlueFocus(), pools, config);
            Prediction prediction = new Prediction();
            prediction.setTitle("结构搜索" + (index + 1));
            prediction.setRedNumbers(redNumbers);
            prediction.setBlueNumber(blueNumber);
            prediction.setScore(predictionScore(redNumbers, blueNumber, pools, targetAverage, config, draws));
            predictions.add(prediction);
        }
        return predictions;
    }

    private void collectCombinations(List<String> pool, int start, List<String> current, List<List<String>> result) {
        if (current.size() == 6) {
            result.add(new ArrayList<>(current));
            return;
        }
        int remaining = 6 - current.size();
        for (int index = start; index <= pool.size() - remaining; index++) {
            current.add(pool.get(index));
            collectCombinations(pool, index + 1, current, result);
            current.remove(current.size() - 1);
        }
    }

    private List<Prediction> diversePredictions(List<Prediction> predictions) {
        List<Prediction> sorted = predictions.stream()
                .filter(prediction -> prediction.getRedNumbers() != null && prediction.getRedNumbers().size() == 6)
                .sorted(Comparator.comparingInt(Prediction::getScore).reversed()
                        .thenComparing(Prediction::getTitle))
                .collect(Collectors.toList());
        List<Prediction> result = new ArrayList<>();
        for (Prediction prediction : sorted) {
            boolean duplicate = result.stream().anyMatch(existing ->
                    existing.getRedNumbers().equals(prediction.getRedNumbers())
                            && existing.getBlueNumber().equals(prediction.getBlueNumber()));
            boolean tooSimilar = result.stream().anyMatch(existing -> overlap(existing.getRedNumbers(), prediction.getRedNumbers()) >= 5);
            if (!duplicate && (!tooSimilar || result.size() < 3)) {
                result.add(prediction);
            }
            if (result.size() >= SEARCH_PREDICTION_LIMIT) {
                break;
            }
        }
        return result;
    }

    private int predictionScore(List<String> redNumbers, String blueNumber, Pools pools, double targetAverage,
                                PredictionRuleConfig config, List<Draw> draws) {
        return (int) Math.round(redNumbers.stream()
                .mapToDouble(number -> numberScore(number, pools.getRedFrequency(), pools.getRedOmissions(), targetAverage, config))
                .sum()
                + combinationHealthScore(redNumbers, draws, targetAverage, config)
                + structureFitnessScore(redNumbers, config, draws)
                + recentCoverageScore(redNumbers, draws, config)
                + blueScore(blueNumber, pools, config));
    }

    private double combinationSearchScore(List<String> redNumbers, Pools pools, double targetAverage,
                                          PredictionRuleConfig config, List<Draw> draws) {
        return redNumbers.stream()
                .mapToDouble(number -> numberScore(number, pools.getRedFrequency(), pools.getRedOmissions(), targetAverage, config))
                .sum()
                + combinationHealthScore(redNumbers, draws, targetAverage, config)
                + structureFitnessScore(redNumbers, config, draws)
                + recentCoverageScore(redNumbers, draws, config);
    }

    private double structureFitnessScore(List<String> redNumbers, PredictionRuleConfig config, List<Draw> draws) {
        Profile profile = profile(redNumbers);
        int[] zones = zoneCounts(redNumbers);
        int recentOverlap = draws.isEmpty() ? 0 : overlap(redNumbers, draws.get(draws.size() - 1).getRedNumbers());
        int consecutivePairs = consecutivePairs(redNumbers);
        double zoneScore = config.isRequireZoneCoverage() && Arrays.stream(zones).anyMatch(count -> count == 0)
                ? -30
                : 10 - (Math.max(Math.max(zones[0], zones[1]), zones[2]) - Math.min(Math.min(zones[0], zones[1]), zones[2])) * 3;
        return 30
                - Math.abs(profile.getOddCount() - config.getTargetOddCount()) * 6 * config.getOddEvenProbabilityWeight()
                - Math.abs(profile.getBigCount() - config.getTargetBigCount()) * 5
                - Math.max(0, recentOverlap - 2) * 8
                - Math.max(0, consecutivePairs - 1) * 5
                + zoneScore
                + recentStructureScore(redNumbers, draws, config);
    }

    private double recentStructureScore(List<String> redNumbers, List<Draw> draws, PredictionRuleConfig config) {
        if (draws.isEmpty()) {
            return 0;
        }
        int window = Math.min(config.getRecentWindow(), draws.size());
        List<Draw> recentDraws = draws.subList(draws.size() - window, draws.size());
        Profile profile = profile(redNumbers);
        int[] zones = zoneCounts(redNumbers);
        int redSum = sum(redNumbers);
        int span = span(redNumbers);

        double averageSum = recentDraws.stream().mapToInt(Draw::getRedSum).average().orElse(redSum);
        double averageOddCount = recentDraws.stream().mapToInt(Draw::getOddCount).average().orElse(profile.getOddCount());
        double averageBigCount = recentDraws.stream().mapToInt(Draw::getBigCount).average().orElse(profile.getBigCount());
        double averageSpan = recentDraws.stream()
                .mapToInt(draw -> span(draw.getRedNumbers()))
                .average()
                .orElse(span);
        double[] averageZones = averageZoneCounts(recentDraws);

        double zonePenalty = 0;
        for (int index = 0; index < zones.length; index++) {
            zonePenalty += Math.abs(zones[index] - averageZones[index]);
        }

        return 18
                - Math.abs(redSum - averageSum) / 8 * config.getAverageDiffWeight()
                - Math.abs(profile.getOddCount() - averageOddCount) * 3 * config.getOddEvenProbabilityWeight()
                - Math.abs(profile.getBigCount() - averageBigCount) * 2.5
                - Math.abs(span - averageSpan) / 3
                - zonePenalty * 2;
    }

    private double recentCoverageScore(List<String> redNumbers, List<Draw> draws, PredictionRuleConfig config) {
        if (draws.isEmpty()) {
            return 0;
        }
        int window = Math.min(config.getRecentWindow(), draws.size());
        List<Draw> recentDraws = draws.subList(draws.size() - window, draws.size());
        Map<String, Long> recentHits = recentDraws.stream()
                .flatMap(draw -> draw.getRedNumbers().stream())
                .collect(Collectors.groupingBy(number -> number, Collectors.counting()));
        double averageRecentHits = recentHits.values().stream()
                .mapToLong(Long::longValue)
                .average()
                .orElse(0);
        Set<String> latestNumbers = new LinkedHashSet<>(draws.get(draws.size() - 1).getRedNumbers());
        int latestOverlap = overlap(redNumbers, draws.get(draws.size() - 1).getRedNumbers());
        double coverage = redNumbers.stream()
                .mapToDouble(number -> {
                    long count = recentHits.getOrDefault(number, 0L);
                    double normalized = averageRecentHits <= 0 ? 0 : count / averageRecentHits;
                    double repeatPenalty = latestNumbers.contains(number) ? 0.55 : 1.0;
                    return Math.min(normalized, 2.0) * repeatPenalty;
                })
                .sum();
        return coverage * 2.2 - Math.max(0, latestOverlap - 2) * 4;
    }

    private boolean validPredictionProfile(List<String> redNumbers, PredictionRuleConfig config) {
        Profile profile = profile(redNumbers);
        if (Math.abs(profile.getOddCount() - config.getTargetOddCount()) > 1) {
            return false;
        }
        if (Math.abs(profile.getBigCount() - config.getTargetBigCount()) > 1) {
            return false;
        }
        return !config.isRequireZoneCoverage() || Arrays.stream(zoneCounts(redNumbers)).allMatch(count -> count > 0);
    }

    private String selectBlueNumber(int index, List<String> blueFocus, Pools pools, PredictionRuleConfig config) {
        List<String> rankedBlue = unique(blueFocus, pools.getBlueOmissions().stream()
                .sorted(Comparator
                        .comparingDouble((NumberOmission item) -> blueScore(item.getNumber(), pools, config)).reversed()
                        .thenComparing(item -> Integer.valueOf(item.getNumber())))
                .map(NumberOmission::getNumber)
                .collect(Collectors.toList()), createNumbers(16));
        return rankedBlue.isEmpty() ? "01" : rankedBlue.get(index % rankedBlue.size());
    }

    private double blueScore(String blueNumber, Pools pools, PredictionRuleConfig config) {
        int actualFrequency = frequency(pools.getBlueFrequency(), blueNumber);
        double expectedFrequency = pools.getBlueFrequency().stream().mapToInt(FrequencyItem::getCount).sum() / 16.0;
        double frequencyBalance = expectedFrequency > actualFrequency
                ? Math.min(expectedFrequency - actualFrequency, expectedFrequency * 0.3)
                : (actualFrequency - expectedFrequency) * 0.15;
        return Math.min(omission(pools.getBlueOmissions(), blueNumber), 3) * 3 * config.getBlueOmissionWeight()
                + actualFrequency * 0.35
                + frequencyBalance;
    }

    private ScoredPrediction score(Prediction prediction, Draw actual) {
        int redHits = (int) prediction.getRedNumbers().stream().filter(actual.getRedNumbers()::contains).count();
        boolean blueHit = prediction.getBlueNumber().equals(actual.getBlueNumber());
        PredictionScore score = new PredictionScore();
        score.setRedHits(redHits);
        score.setBlueHit(blueHit);
        score.setPrizeName(prize(redHits, blueHit));
        score.setScore(redHits * 12 + (blueHit ? 10 : 0));

        ScoredPrediction scored = new ScoredPrediction();
        scored.setTitle(prediction.getTitle());
        scored.setResult(score);
        return scored;
    }

    private Pools buildPools(List<Draw> draws, PredictionRuleConfig config) {
        List<Draw> recent = draws.subList(Math.max(0, draws.size() - config.getRecentWindow()), draws.size());
        List<FrequencyItem> recentRedFrequency = buildFrequency(recent, true);
        List<FrequencyItem> redFrequency = buildFrequency(draws, true);
        List<FrequencyItem> blueFrequency = buildFrequency(draws, false);
        List<NumberOmission> redOmissions = buildOmissions(draws, true);
        List<NumberOmission> blueOmissions = buildOmissions(draws, false);

        Pools pools = new Pools();
        pools.setRedFrequency(redFrequency);
        pools.setBlueFrequency(blueFrequency);
        pools.setRedOmissions(redOmissions);
        pools.setBlueOmissions(blueOmissions);
        pools.setActiveRed(recentRedFrequency.stream().filter(item -> item.getCount() > 0)
                .limit(6).map(FrequencyItem::getNumber).collect(Collectors.toList()));
        pools.setOverdueRed(redOmissions.stream().filter(item -> item.getCount() > 0)
                .sorted(Comparator.comparingDouble((NumberOmission item) -> item.getOmissionRatio() * config.getOmissionWeight()).reversed()
                        .thenComparing(NumberOmission::getCurrentOmission, Comparator.reverseOrder()))
                .limit(6).map(NumberOmission::getNumber).collect(Collectors.toList()));
        pools.setBalancedRed(redOmissions.stream().filter(item -> item.getCount() > 0 && item.getOmissionRatio() >= 0.8)
                .sorted(Comparator.comparingDouble((NumberOmission item) ->
                        (3 - Math.abs(item.getOmissionRatio() - 1.4)) * config.getBalancedWeight() + item.getCount() / 10.0).reversed())
                .limit(6).map(NumberOmission::getNumber).collect(Collectors.toList()));
        pools.setBlueFocus(blueOmissions.stream().filter(item -> item.getCount() > 0)
                .sorted(Comparator.comparingDouble((NumberOmission item) -> item.getOmissionRatio() * config.getBlueOmissionWeight()).reversed()
                        .thenComparing(NumberOmission::getCurrentOmission, Comparator.reverseOrder()))
                .limit(4).map(NumberOmission::getNumber).collect(Collectors.toList()));
        return pools;
    }

    private List<String> completeRedNumbers(List<String> seeds, List<String> fallback, List<FrequencyItem> redFrequency,
                                            List<NumberOmission> redOmissions, double targetAverage,
                                            PredictionRuleConfig config, Draw latestDraw) {
        Set<String> avoided = config.isAvoidLastDraw() ? new LinkedHashSet<>(latestDraw.getRedNumbers()) : Collections.emptySet();
        List<String> candidates = unique(seeds, fallback, createNumbers(33)).stream()
                .filter(number -> !avoided.contains(number))
                .collect(Collectors.toList());
        List<String> selected = new ArrayList<>();
        for (String candidate : candidates) {
            if (selected.size() >= 6) {
                break;
            }
            if (selected.contains(candidate)) {
                continue;
            }
            List<String> draft = new ArrayList<>(selected);
            draft.add(candidate);
            Profile profile = profile(draft);
            if (profile.getOddCount() <= config.getTargetOddCount() + 1
                    && profile.getEvenCount() <= 7 - config.getTargetOddCount()
                    && profile.getBigCount() <= config.getTargetBigCount() + 1
                    && profile.getSmallCount() <= 7 - config.getTargetBigCount()) {
                selected.add(candidate);
            }
        }
        for (String candidate : candidates) {
            if (selected.size() >= 6) {
                break;
            }
            if (!selected.contains(candidate)) {
                selected.add(candidate);
            }
        }
        selected.sort(Comparator
                .comparingDouble((String number) -> numberScore(number, redFrequency, redOmissions, targetAverage, config)).reversed()
                .thenComparing(number -> Integer.valueOf(number)));
        List<String> result = new ArrayList<>(selected.subList(0, Math.min(6, selected.size())));
        result.sort(Comparator.comparingInt(Integer::valueOf));
        return result;
    }

    private double numberScore(String number, List<FrequencyItem> redFrequency, List<NumberOmission> redOmissions,
                               double targetAverage, PredictionRuleConfig config) {
        double expectedNumber = targetAverage / 6;
        double diff = Math.abs(Integer.parseInt(number) - expectedNumber);
        int actualFrequency = frequency(redFrequency, number);
        double expectedFrequency = redFrequency.stream().mapToInt(FrequencyItem::getCount).sum() / 33.0;
        double teamLineDiff = expectedFrequency - actualFrequency;
        double returnToLineScore = teamLineDiff > 0
                ? Math.min(teamLineDiff, expectedFrequency * 0.2) * config.getBalancedWeight()
                : teamLineDiff * 0.35 * config.getBalancedWeight();
        return actualFrequency * config.getActiveWeight()
                + Math.min(omission(redOmissions, number), 3) * 2 * config.getOmissionWeight()
                + returnToLineScore
                - diff / 10 * config.getAverageDiffWeight()
                - Math.pow(diff, 2) / 100 * config.getSquaredDiffWeight();
    }

    private double combinationHealthScore(List<String> redNumbers, List<Draw> draws, double targetAverage,
                                          PredictionRuleConfig config) {
        if (redNumbers.isEmpty() || draws.isEmpty()) {
            return 0;
        }
        List<Integer> values = redNumbers.stream().map(Integer::parseInt).collect(Collectors.toList());
        int sum = values.stream().mapToInt(Integer::intValue).sum();
        double expectedNumber = targetAverage / 6;
        double squaredDeviation = values.stream()
                .mapToDouble(number -> Math.pow(number - expectedNumber, 2))
                .average()
                .orElse(0);
        double oddProbability = draws.stream().mapToInt(Draw::getOddCount).sum() / (double) (draws.size() * 6);
        double expectedOddCount = oddProbability * 6;
        long oddCount = values.stream().filter(number -> number % 2 != 0).count();
        return 40
                - Math.abs(sum - targetAverage) / 6 * config.getAverageDiffWeight()
                - squaredDeviation / 20 * config.getSquaredDiffWeight()
                - Math.abs(oddCount - expectedOddCount) * 6 * config.getOddEvenProbabilityWeight();
    }

    private List<PredictionRuleConfig> buildTrainingConfigs(String scale) {
        int[] windows = "deep".equals(scale) ? new int[]{10, 20, 30} : "standard".equals(scale) ? new int[]{20, 30} : new int[]{20};
        double[] activeWeights = "fast".equals(scale) ? new double[]{1.0} : new double[]{0.8, 1.2};
        double[] omissionWeights = "fast".equals(scale) ? new double[]{1.2, 1.6} : new double[]{1.0, 1.4, 1.8};
        double[] blueWeights = "deep".equals(scale) ? new double[]{0.8, 1.2} : new double[]{1.0};
        List<PredictionRuleConfig> configs = new ArrayList<>();
        for (int window : windows) {
            for (double activeWeight : activeWeights) {
                for (double omissionWeight : omissionWeights) {
                    for (double blueWeight : blueWeights) {
                        PredictionRuleConfig config = PredictionRuleConfig.defaultConfig();
                        config.setId("w" + window + "-a" + activeWeight + "-o" + omissionWeight + "-b" + blueWeight);
                        config.setName("窗口" + window + " 热" + activeWeight + " 遗" + omissionWeight + " 蓝" + blueWeight);
                        config.setRecentWindow(window);
                        config.setActiveWeight(activeWeight);
                        config.setOmissionWeight(omissionWeight);
                        config.setBalancedWeight(Math.max(0.6, 2.4 - (activeWeight + omissionWeight) / 2));
                        config.setBlueOmissionWeight(blueWeight);
                        config.setAverageDiffWeight(window == 10 ? 0.8 : window == 20 ? 1.0 : 1.2);
                        config.setSquaredDiffWeight(omissionWeight >= 1.4 ? 1.2 : 0.8);
                        config.setOddEvenProbabilityWeight(config.getBalancedWeight());
                        configs.add(config);
                    }
                }
            }
        }
        int max = "deep".equals(scale) ? 24 : "standard".equals(scale) ? 12 : 2;
        return configs.subList(0, Math.min(max, configs.size()));
    }

    private List<PredictionRuleConfig> buildExplorationConfigs(PredictionRuleConfig baseConfig, int generation, String scale) {
        PredictionRuleConfig normalizedBase = normalizeConfig(copyConfig(baseConfig));
        int count = "deep".equals(scale) ? 16 : "standard".equals(scale) ? 10 : 6;
        Random random = new Random(generation * 7919L + normalizedBase.getId().hashCode());
        List<PredictionRuleConfig> configs = new ArrayList<>();
        configs.add(namedExplorationConfig(normalizedBase, generation, 0));
        for (int index = 1; index < count; index++) {
            PredictionRuleConfig config = copyConfig(normalizedBase);
            double range = 0.08 + Math.min(0.24, generation * 0.01);
            config.setId("explore-g" + generation + "-" + index);
            config.setName("第" + generation + "代探索" + index);
            config.setActiveWeight(clamp(config.getActiveWeight() + randomDelta(random, range), 0.6, 2.4));
            config.setOmissionWeight(clamp(config.getOmissionWeight() + randomDelta(random, range), 0.6, 2.4));
            config.setBalancedWeight(clamp(config.getBalancedWeight() + randomDelta(random, range), 0.6, 2.4));
            config.setBlueOmissionWeight(clamp(config.getBlueOmissionWeight() + randomDelta(random, range), 0.6, 2.4));
            config.setAverageDiffWeight(clamp(config.getAverageDiffWeight() + randomDelta(random, range), 0.6, 2.4));
            config.setSquaredDiffWeight(clamp(config.getSquaredDiffWeight() + randomDelta(random, range), 0.6, 2.4));
            config.setOddEvenProbabilityWeight(clamp(config.getOddEvenProbabilityWeight() + randomDelta(random, range), 0.6, 2.4));
            if (random.nextDouble() < 0.25) {
                config.setTargetOddCount(Math.max(2, Math.min(4, config.getTargetOddCount() + (random.nextBoolean() ? 1 : -1))));
            }
            configs.add(config);
        }
        return configs;
    }

    private PredictionRuleConfig namedExplorationConfig(PredictionRuleConfig source, int generation, int index) {
        PredictionRuleConfig config = copyConfig(source);
        config.setId("explore-g" + generation + "-" + index);
        config.setName("第" + generation + "代继承规则");
        return config;
    }

    private double randomDelta(Random random, double range) {
        return roundOne((random.nextDouble() * 2 - 1) * range);
    }

    private List<Draw> parseRecords() {
        String content = RecordFile.read(RecordFile.RECORDS);
        String[] lines = content.split("\\r?\\n");
        List<Draw> draws = new ArrayList<>();
        for (String line : lines) {
            String raw = line.trim();
            if (!raw.matches("\\d{14}")) {
                continue;
            }
            Draw draw = new Draw();
            draw.setPeriod(draws.size() + 1);
            draw.setRaw(raw);
            draw.setRedNumbers(Arrays.asList(raw.substring(0, 2), raw.substring(2, 4), raw.substring(4, 6),
                    raw.substring(6, 8), raw.substring(8, 10), raw.substring(10, 12)));
            draw.setBlueNumber(raw.substring(12, 14));
            int redSum = draw.getRedNumbers().stream().mapToInt(Integer::parseInt).sum();
            int oddCount = (int) draw.getRedNumbers().stream().mapToInt(Integer::parseInt).filter(number -> number % 2 != 0).count();
            int bigCount = (int) draw.getRedNumbers().stream().mapToInt(Integer::parseInt).filter(number -> number >= 17).count();
            draw.setRedSum(redSum);
            draw.setOddCount(oddCount);
            draw.setEvenCount(6 - oddCount);
            draw.setBigCount(bigCount);
            draw.setSmallCount(6 - bigCount);
            draws.add(draw);
        }
        return draws;
    }

    private List<FrequencyItem> buildFrequency(List<Draw> draws, boolean red) {
        Map<String, Integer> frequency = createNumbers(red ? 33 : 16).stream()
                .collect(Collectors.toMap(number -> number, number -> 0, (a, b) -> a, LinkedHashMap::new));
        for (Draw draw : draws) {
            if (red) {
                for (String number : draw.getRedNumbers()) {
                    frequency.put(number, frequency.get(number) + 1);
                }
            } else {
                frequency.put(draw.getBlueNumber(), frequency.get(draw.getBlueNumber()) + 1);
            }
        }
        return frequency.entrySet().stream()
                .map(entry -> new FrequencyItem(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparingInt(FrequencyItem::getCount).reversed()
                        .thenComparing(item -> Integer.parseInt(item.getNumber())))
                .collect(Collectors.toList());
    }

    private List<NumberOmission> buildOmissions(List<Draw> draws, boolean red) {
        List<NumberOmission> result = new ArrayList<>();
        for (String number : createNumbers(red ? 33 : 16)) {
            List<Integer> periods = draws.stream()
                    .filter(draw -> red ? draw.getRedNumbers().contains(number) : draw.getBlueNumber().equals(number))
                    .map(Draw::getPeriod)
                    .collect(Collectors.toList());
            int count = periods.size();
            int current = count > 0 ? draws.size() - periods.get(periods.size() - 1) : draws.size();
            double average = count > 0 ? roundOne((double) draws.size() / count) : draws.size();
            NumberOmission item = new NumberOmission();
            item.setNumber(number);
            item.setCount(count);
            item.setCurrentOmission(current);
            item.setOmissionRatio(average > 0 ? roundOne(current / average) : 0);
            result.add(item);
        }
        return result;
    }

    private String prize(int redHits, boolean blueHit) {
        if (redHits == 6 && blueHit) return "一等奖";
        if (redHits == 6) return "二等奖";
        if (redHits == 5 && blueHit) return "三等奖";
        if (redHits == 5 || (redHits == 4 && blueHit)) return "四等奖";
        if (redHits == 4 || (redHits == 3 && blueHit)) return "五等奖";
        if (blueHit && redHits <= 2) return "六等奖";
        return "未中奖";
    }

    private String safeScale(String scale) {
        return Arrays.asList("fast", "standard", "deep").contains(scale) ? scale : "fast";
    }

    private int safeReplayCount(int replayCount, String scale, int drawCount) {
        int historicalReplayCount = Math.max(1, drawCount - 20);
        if (replayCount <= 0) {
            return historicalReplayCount;
        }
        int max = "deep".equals(scale) ? 30 : "standard".equals(scale) ? 20 : 10;
        return Math.max(1, Math.min(replayCount, Math.min(max, historicalReplayCount)));
    }

    private double roundOne(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private double clamp(double value, double min, double max) {
        return roundOne(Math.max(min, Math.min(value, max)));
    }

    private PredictionRuleConfig copyConfig(PredictionRuleConfig source) {
        source = normalizeConfig(source);
        PredictionRuleConfig target = new PredictionRuleConfig();
        target.setId(source.getId());
        target.setName(source.getName());
        target.setRecentWindow(source.getRecentWindow());
        target.setActiveWeight(source.getActiveWeight());
        target.setOmissionWeight(source.getOmissionWeight());
        target.setBalancedWeight(source.getBalancedWeight());
        target.setBlueOmissionWeight(source.getBlueOmissionWeight());
        target.setAverageDiffWeight(source.getAverageDiffWeight());
        target.setSquaredDiffWeight(source.getSquaredDiffWeight());
        target.setOddEvenProbabilityWeight(source.getOddEvenProbabilityWeight());
        target.setTargetOddCount(source.getTargetOddCount());
        target.setTargetBigCount(source.getTargetBigCount());
        target.setRequireZoneCoverage(source.isRequireZoneCoverage());
        target.setAvoidLastDraw(source.isAvoidLastDraw());
        return target;
    }

    private PredictionRuleConfig normalizeConfig(PredictionRuleConfig config) {
        if (config.getAverageDiffWeight() <= 0) {
            config.setAverageDiffWeight(1.0);
        }
        if (config.getSquaredDiffWeight() <= 0) {
            config.setSquaredDiffWeight(1.0);
        }
        if (config.getOddEvenProbabilityWeight() <= 0) {
            config.setOddEvenProbabilityWeight(1.0);
        }
        return config;
    }

    private List<String> createNumbers(int max) {
        List<String> numbers = new ArrayList<>();
        for (int index = 1; index <= max; index++) {
            numbers.add(String.format("%02d", index));
        }
        return numbers;
    }

    @SafeVarargs
    private final List<String> unique(List<String>... numberGroups) {
        LinkedHashSet<String> numbers = new LinkedHashSet<>();
        for (List<String> group : numberGroups) {
            numbers.addAll(group);
        }
        return new ArrayList<>(numbers);
    }

    private List<String> concat(List<String> first, int firstCount, List<String> second, int secondCount,
                                List<String> third, int thirdCount) {
        List<String> result = new ArrayList<>();
        result.addAll(first.stream().limit(firstCount).collect(Collectors.toList()));
        result.addAll(second.stream().limit(secondCount).collect(Collectors.toList()));
        result.addAll(third.stream().limit(thirdCount).collect(Collectors.toList()));
        return result;
    }

    private Profile profile(List<String> numbers) {
        Profile profile = new Profile();
        int odd = (int) numbers.stream().mapToInt(Integer::parseInt).filter(number -> number % 2 != 0).count();
        int big = (int) numbers.stream().mapToInt(Integer::parseInt).filter(number -> number >= 17).count();
        profile.setOddCount(odd);
        profile.setEvenCount(numbers.size() - odd);
        profile.setBigCount(big);
        profile.setSmallCount(numbers.size() - big);
        return profile;
    }

    private int sum(List<String> numbers) {
        return numbers.stream().mapToInt(Integer::parseInt).sum();
    }

    private int overlap(List<String> first, List<String> second) {
        return (int) first.stream().filter(second::contains).count();
    }

    private int consecutivePairs(List<String> numbers) {
        List<Integer> sorted = numbers.stream().map(Integer::parseInt).sorted().collect(Collectors.toList());
        int count = 0;
        for (int index = 1; index < sorted.size(); index++) {
            if (sorted.get(index - 1) + 1 == sorted.get(index)) {
                count++;
            }
        }
        return count;
    }

    private int span(List<String> numbers) {
        if (numbers.isEmpty()) {
            return 0;
        }
        List<Integer> sorted = numbers.stream().map(Integer::parseInt).sorted().collect(Collectors.toList());
        return sorted.get(sorted.size() - 1) - sorted.get(0);
    }

    private int[] zoneCounts(List<String> numbers) {
        int[] zones = new int[]{0, 0, 0};
        for (String number : numbers) {
            int value = Integer.parseInt(number);
            if (value <= 11) {
                zones[0]++;
            } else if (value <= 22) {
                zones[1]++;
            } else {
                zones[2]++;
            }
        }
        return zones;
    }

    private double[] averageZoneCounts(List<Draw> draws) {
        double[] zones = new double[]{0, 0, 0};
        if (draws.isEmpty()) {
            return zones;
        }
        for (Draw draw : draws) {
            int[] drawZones = zoneCounts(draw.getRedNumbers());
            for (int index = 0; index < zones.length; index++) {
                zones[index] += drawZones[index];
            }
        }
        for (int index = 0; index < zones.length; index++) {
            zones[index] = zones[index] / draws.size();
        }
        return zones;
    }

    private int frequency(List<FrequencyItem> frequency, String number) {
        return frequency.stream().filter(item -> item.getNumber().equals(number)).findFirst().map(FrequencyItem::getCount).orElse(0);
    }

    private double omission(List<NumberOmission> omissions, String number) {
        return omissions.stream().filter(item -> item.getNumber().equals(number)).findFirst().map(NumberOmission::getOmissionRatio).orElse(0.0);
    }

    @Data
    private static class Draw {
        private int period;
        private String raw;
        private List<String> redNumbers;
        private String blueNumber;
        private int redSum;
        private int oddCount;
        private int evenCount;
        private int bigCount;
        private int smallCount;
    }

    @Data
    private static class FrequencyItem {
        private final String number;
        private final int count;
    }

    @Data
    private static class NumberOmission {
        private String number;
        private int count;
        private int currentOmission;
        private double omissionRatio;
    }

    @Data
    private static class Profile {
        private int oddCount;
        private int evenCount;
        private int bigCount;
        private int smallCount;
    }

    @Data
    private static class Pools {
        private List<String> activeRed;
        private List<String> overdueRed;
        private List<String> balancedRed;
        private List<String> blueFocus;
        private List<FrequencyItem> redFrequency;
        private List<FrequencyItem> blueFrequency;
        private List<NumberOmission> redOmissions;
        private List<NumberOmission> blueOmissions;
    }

    @Data
    private static class Prediction {
        private String title;
        private List<String> redNumbers;
        private String blueNumber;
        private int score;
    }

    @Data
    private static class ScoredPrediction {
        private String title;
        private PredictionScore result;
    }

    @Data
    private static class PredictionScore {
        private int redHits;
        private boolean blueHit;
        private String prizeName;
        private int score;
    }

    @Data
    private static class RollingTrainingResult {
        private List<LotteryTrainingReport.TrainingTimelineItem> timeline;
        private PredictionRuleConfig finalConfig;
    }
}
