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
public class LotteryReplayMetrics implements Serializable {

    private Integer requestedWindow;

    private Integer actualWindow;

    private Integer reportReplayCount;

    private Integer generation;

    private Double averageScore;

    private Double averageRedHits;

    private Integer blueHitRate;

    private Integer bestScore;

    @Builder.Default
    private Map<String, Integer> prizeDistribution = new LinkedHashMap<>();

    private Long generatedAt;
}
