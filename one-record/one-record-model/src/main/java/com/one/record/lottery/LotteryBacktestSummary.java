package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryBacktestSummary implements Serializable {

    private String backtestId;

    private String strategyName;

    private String presetWindow;

    private String issueStart;

    private String issueEnd;

    private Integer replayCount;

    private BigDecimal averageRedHits;

    private BigDecimal blueHitRate;

    private Integer bestScore;

    private Integer stabilityScore;

    private BigDecimal totalCost;

    private BigDecimal totalPrize;

    private BigDecimal netResult;

    private BigDecimal roiPercent;

    @Builder.Default
    private Map<String, Integer> prizeDistribution = new LinkedHashMap<>();

    private Long createdAt;
}
