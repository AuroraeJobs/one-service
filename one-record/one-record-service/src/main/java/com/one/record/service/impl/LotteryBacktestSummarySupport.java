package com.one.record.service.impl;

import com.one.record.lottery.LotteryBacktestSummary;
import com.one.record.model.LotteryBacktestReport;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

final class LotteryBacktestSummarySupport {

    private LotteryBacktestSummarySupport() {
    }

    static Map<String, LotteryBacktestSummary> latestByKey(List<LotteryBacktestReport> reports) {
        Map<String, LotteryBacktestSummary> summaries = new LinkedHashMap<>();
        if (reports == null) {
            return summaries;
        }
        reports.stream()
                .sorted((left, right) -> Long.compare(timestamp(right), timestamp(left)))
                .forEach(report -> {
                    LotteryBacktestSummary summary = summary(report);
                    putIfPresent(summaries, report.getStrategyName(), summary);
                    putIfPresent(summaries, report.getExperimentId(), summary);
                });
        return summaries;
    }

    static LotteryBacktestSummary find(Map<String, LotteryBacktestSummary> summaries, String... keys) {
        if (summaries == null || keys == null) {
            return null;
        }
        for (String key : keys) {
            String normalized = normalize(key);
            if (normalized != null && summaries.containsKey(normalized)) {
                return summaries.get(normalized);
            }
        }
        return null;
    }

    private static LotteryBacktestSummary summary(LotteryBacktestReport report) {
        if (report == null) {
            return null;
        }
        return LotteryBacktestSummary.builder()
                .backtestId(report.getId())
                .strategyName(report.getStrategyName())
                .presetWindow(report.getPresetWindow())
                .issueStart(report.getIssueStart())
                .issueEnd(report.getIssueEnd())
                .replayCount(report.getReplayCount())
                .averageRedHits(report.getAverageRedHits())
                .blueHitRate(report.getBlueHitRate())
                .baselineAverageRedHits(report.getBaselineAverageRedHits())
                .baselineBlueHitRate(report.getBaselineBlueHitRate())
                .bestScore(report.getBestScore())
                .stabilityScore(report.getStabilityScore())
                .totalCost(report.getTotalCost())
                .totalPrize(report.getTotalPrize())
                .netResult(report.getNetResult())
                .roiPercent(roiPercent(report.getNetResult(), report.getTotalCost()))
                .prizeDistribution(report.getPrizeDistribution() == null ? new LinkedHashMap<>() : new LinkedHashMap<>(report.getPrizeDistribution()))
                .baselinePrizeDistribution(report.getBaselinePrizeDistribution() == null ? new LinkedHashMap<>() : new LinkedHashMap<>(report.getBaselinePrizeDistribution()))
                .createdAt(report.getCreatedAt())
                .build();
    }

    private static void putIfPresent(Map<String, LotteryBacktestSummary> summaries, String key, LotteryBacktestSummary summary) {
        String normalized = normalize(key);
        if (normalized != null && summary != null) {
            summaries.putIfAbsent(normalized, summary);
        }
    }

    private static String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private static long timestamp(LotteryBacktestReport report) {
        return report == null || report.getCreatedAt() == null ? 0L : report.getCreatedAt();
    }

    private static BigDecimal roiPercent(BigDecimal netResult, BigDecimal totalCost) {
        if (netResult == null || totalCost == null || totalCost.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return netResult.multiply(BigDecimal.valueOf(100)).divide(totalCost, 2, RoundingMode.HALF_UP);
    }
}
