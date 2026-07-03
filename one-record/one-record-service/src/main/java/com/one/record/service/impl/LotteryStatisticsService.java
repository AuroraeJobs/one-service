package com.one.record.service.impl;

import com.one.common.util.JsonUtil;
import com.one.record.lottery.LotteryDraw;
import com.one.record.lottery.LotteryStatisticsSummary;
import com.one.record.request.RecordRequest;
import com.one.record.service.ILotteryStatisticsService;
import com.one.record.service.IRecordService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@AllArgsConstructor
public class LotteryStatisticsService implements ILotteryStatisticsService {

    public static final String SUMMARY_CACHE_KEY = "lottery:statistics:summary";

    private static final int PAGE_SIZE = 500;

    private final IRecordService recordService;

    private final StringRedisTemplate redisTemplate;

    @Override
    public LotteryStatisticsSummary summary() {
        LotteryStatisticsSummary cached = readSummaryCache();
        if (cached != null) {
            return cached;
        }
        return refreshSummary();
    }

    @Override
    public LotteryStatisticsSummary refreshSummary() {
        List<LotteryDraw> draws = loadAllDraws();
        LotteryDraw first = recordService.findFirstDraw();
        LotteryDraw latest = recordService.findLastDraw();

        LotteryStatisticsSummary summary = LotteryStatisticsSummary.builder()
                .totalDraws(draws.size())
                .firstIssue(first == null ? null : first.getIssue())
                .latestIssue(latest == null ? null : latest.getIssue())
                .firstDrawDate(first == null ? null : first.getDrawDate())
                .latestDrawDate(latest == null ? null : latest.getDrawDate())
                .firstDraw(first)
                .latestDraw(latest)
                .redFrequency(buildFrequency(draws, true))
                .blueFrequency(buildFrequency(draws, false))
                .redSumDistribution(buildDistribution(draws, draw -> draw.getRedSum() == null ? null : draw.getRedSum().toString()))
                .oddCountDistribution(buildDistribution(draws, draw -> draw.getOddCount() == null ? null : draw.getOddCount().toString()))
                .bigCountDistribution(buildDistribution(draws, draw -> draw.getBigCount() == null ? null : draw.getBigCount().toString()))
                .spanDistribution(buildDistribution(draws, draw -> draw.getSpan() == null ? null : draw.getSpan().toString()))
                .generatedAt(System.currentTimeMillis())
                .build();
        writeSummaryCache(summary);
        return summary;
    }

    @Override
    public Map<String, List<LotteryStatisticsSummary.NumberFrequency>> frequency() {
        LotteryStatisticsSummary summary = summary();
        Map<String, List<LotteryStatisticsSummary.NumberFrequency>> result = new LinkedHashMap<>();
        result.put("red", summary.getRedFrequency());
        result.put("blue", summary.getBlueFrequency());
        return result;
    }

    @Override
    public Map<String, List<LotteryStatisticsSummary.DistributionItem>> distribution() {
        LotteryStatisticsSummary summary = summary();
        Map<String, List<LotteryStatisticsSummary.DistributionItem>> result = new LinkedHashMap<>();
        result.put("redSum", summary.getRedSumDistribution());
        result.put("oddCount", summary.getOddCountDistribution());
        result.put("bigCount", summary.getBigCountDistribution());
        result.put("span", summary.getSpanDistribution());
        return result;
    }

    @Override
    public void invalidateCache() {
        try {
            redisTemplate.delete(SUMMARY_CACHE_KEY);
        } catch (RuntimeException exception) {
            log.warn("彩票统计缓存清理失败，key={}", SUMMARY_CACHE_KEY, exception);
        }
    }

    private LotteryStatisticsSummary readSummaryCache() {
        try {
            String value = redisTemplate.opsForValue().get(SUMMARY_CACHE_KEY);
            if (!StringUtils.hasText(value)) {
                return null;
            }
            return JsonUtil.toObject(value, LotteryStatisticsSummary.class);
        } catch (RuntimeException exception) {
            log.warn("彩票统计缓存读取失败，key={}", SUMMARY_CACHE_KEY, exception);
            return null;
        }
    }

    private void writeSummaryCache(LotteryStatisticsSummary summary) {
        try {
            redisTemplate.opsForValue().set(SUMMARY_CACHE_KEY, JsonUtil.toJson(summary));
        } catch (RuntimeException exception) {
            log.warn("彩票统计缓存写入失败，key={}", SUMMARY_CACHE_KEY, exception);
        }
    }

    private List<LotteryDraw> loadAllDraws() {
        List<LotteryDraw> draws = new ArrayList<>();
        int page = 0;
        while (true) {
            List<LotteryDraw> pageDraws = recordService.findDraws(new RecordRequest(), page, PAGE_SIZE);
            if (pageDraws == null || pageDraws.isEmpty()) {
                break;
            }
            draws.addAll(pageDraws);
            if (pageDraws.size() < PAGE_SIZE) {
                break;
            }
            page += 1;
        }
        return draws;
    }

    private static List<LotteryStatisticsSummary.NumberFrequency> buildFrequency(List<LotteryDraw> draws, boolean red) {
        int max = red ? 33 : 16;
        Map<String, Integer> counts = IntStream.rangeClosed(1, max)
                .mapToObj(number -> String.format("%02d", number))
                .collect(Collectors.toMap(number -> number, number -> 0, (a, b) -> a, LinkedHashMap::new));

        for (LotteryDraw draw : draws) {
            if (red && draw.getRedNumbers() != null) {
                for (String number : draw.getRedNumbers()) {
                    counts.computeIfPresent(number, (key, count) -> count + 1);
                }
            }
            if (!red && draw.getBlueNumber() != null) {
                counts.computeIfPresent(draw.getBlueNumber(), (key, count) -> count + 1);
            }
        }

        int totalHits = red ? draws.size() * 6 : draws.size();
        return counts.entrySet().stream()
                .map(entry -> LotteryStatisticsSummary.NumberFrequency.builder()
                        .number(entry.getKey())
                        .count(entry.getValue())
                        .percent(percent(entry.getValue(), totalHits))
                        .build())
                .sorted(Comparator.comparingInt(LotteryStatisticsSummary.NumberFrequency::getCount).reversed()
                        .thenComparing(LotteryStatisticsSummary.NumberFrequency::getNumber))
                .collect(Collectors.toList());
    }

    private static List<LotteryStatisticsSummary.DistributionItem> buildDistribution(List<LotteryDraw> draws,
                                                                                     Function<LotteryDraw, String> classifier) {
        Map<String, Integer> counts = draws.stream()
                .map(classifier)
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(value -> value, value -> 1, Integer::sum, LinkedHashMap::new));

        return counts.entrySet().stream()
                .map(entry -> LotteryStatisticsSummary.DistributionItem.builder()
                        .value(entry.getKey())
                        .count(entry.getValue())
                        .percent(percent(entry.getValue(), draws.size()))
                        .build())
                .sorted(Comparator.comparingInt(entry -> Integer.parseInt(entry.getValue())))
                .collect(Collectors.toList());
    }

    private static double percent(int count, int total) {
        if (total <= 0) {
            return 0;
        }
        return Math.round((count * 1000.0 / total)) / 10.0;
    }
}
