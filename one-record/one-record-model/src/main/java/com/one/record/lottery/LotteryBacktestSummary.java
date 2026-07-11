package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryBacktestSummary implements Serializable {

    private String backtestId;

    private String decisionSetId;

    private LotteryResearchProvenance provenance;

    private String strategyName;

    private String presetWindow;

    private String issueStart;

    private String issueEnd;

    private Integer replayCount;

    private Long baselineSeed;

    private String baselineAlgorithm;

    private Integer windowIssueCount;

    private Integer candidateCount;

    private Integer uniqueCandidateCount;

    private Integer ticketCount;

    private Integer baselineTicketCount;

    private Boolean sameWindow;

    private Boolean sameBudget;

    private BigDecimal averageRedHits;

    private BigDecimal blueHitRate;

    private BigDecimal baselineAverageRedHits;

    private BigDecimal baselineBlueHitRate;

    private Integer bestScore;

    private Integer stabilityScore;

    private BigDecimal totalCost;

    private BigDecimal totalPrize;

    private BigDecimal netResult;

    private BigDecimal roiPercent;

    private BigDecimal baselineTotalCost;

    private BigDecimal baselineTotalPrize;

    private BigDecimal baselineNetResult;

    private BigDecimal baselineRoiPercent;

    private BigDecimal averageRedHitsDelta;

    private BigDecimal blueHitRateDelta;

    private BigDecimal totalPrizeDelta;

    private BigDecimal netResultDelta;

    private BigDecimal roiPercentDelta;

    private BigDecimal candidateDiversity;

    @Builder.Default
    private Map<String, Integer> prizeDistribution = new LinkedHashMap<>();

    @Builder.Default
    private Map<String, Integer> baselinePrizeDistribution = new LinkedHashMap<>();

    @Builder.Default
    private Map<String, Integer> hitDistribution = new LinkedHashMap<>();

    @Builder.Default
    private Map<String, Integer> baselineHitDistribution = new LinkedHashMap<>();

    private Integer maxRedOverlap;

    private Integer distinctBlueCount;

    private String evaluationMode;

    @Builder.Default
    private List<String> overfitWarnings = new ArrayList<>();

    private Long createdAt;
}
