package com.one.record.training;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryReplaySummary implements Serializable {

    private String ruleId;

    private String ruleName;

    private Integer ruleGeneration;

    private Integer replayWindow;

    private Integer baselineWindow;

    private Integer candidateCount;

    private Integer scoredCandidateCount;

    private Double recentAverageScore;

    private Double baselineAverageScore;

    private Double averageScoreDrift;

    private Double recentAverageRedHits;

    private Double baselineAverageRedHits;

    private Double averageRedHitsDrift;

    private Integer recentBlueHitRate;

    private Integer baselineBlueHitRate;

    private Integer blueHitRateDrift;

    private Integer bestScore;

    private String driftLabel;

    @Builder.Default
    private Map<String, Integer> prizeDistribution = new LinkedHashMap<>();

    @Builder.Default
    private Map<String, Integer> redHitDistribution = new LinkedHashMap<>();

    @Builder.Default
    private Map<String, Integer> candidatePrizeDistribution = new LinkedHashMap<>();

    @Builder.Default
    private Map<String, Integer> candidateRedHitDistribution = new LinkedHashMap<>();

    private Long generatedAt;
}
