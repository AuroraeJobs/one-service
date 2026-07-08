package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryRecommendationRollup implements Serializable {

    private String window;

    private Integer requestedLimit;

    private Integer recommendationCount;

    private Integer activeCount;

    private Integer watchCount;

    private Integer pausedCount;

    private Integer retiredCount;

    private Integer staleCount;

    private Integer appliedCount;

    @Builder.Default
    private Map<String, Integer> recommendationStateDistribution = new LinkedHashMap<>();

    @Builder.Default
    private Map<String, Integer> lifecycleStatusDistribution = new LinkedHashMap<>();

    @Builder.Default
    private Map<String, Integer> targetTypeDistribution = new LinkedHashMap<>();

    @Builder.Default
    private List<TransitionRow> transitions = new ArrayList<>();

    private Long generatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransitionRow implements Serializable {

        private String day;

        private String lifecycleStatus;

        private String recommendationState;

        private Integer count;
    }
}
