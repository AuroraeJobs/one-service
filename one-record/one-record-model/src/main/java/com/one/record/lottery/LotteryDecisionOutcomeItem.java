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
public class LotteryDecisionOutcomeItem implements Serializable {

    private String decisionSetId;

    private String title;

    private String targetIssue;

    private String ruleName;

    private LotteryResearchProvenance provenance;

    private String reviewAction;

    private String reviewNote;

    private String reviewBacktestId;

    private Long reviewedAt;

    private String conversionState;

    private String status;

    private Integer candidateCount;

    private Integer scoredCandidateCount;

    private Integer winningCandidateCount;

    private Integer convertedTicketCount;

    private Integer checkedConvertedTicketCount;

    private Integer winningConvertedTicketCount;

    private BigDecimal totalCost;

    private BigDecimal totalPrize;

    private BigDecimal netResult;

    private BigDecimal roiPercent;

    private BigDecimal hitRatePercent;

    private Integer bestRedHits;

    private Integer blueHitCount;

    private Integer warningCount;

    private Integer staleEvidenceCount;

    private Integer volatileEvidenceCount;

    private Integer underTestedEvidenceCount;

    @Builder.Default
    private Map<String, Integer> hitDistribution = new LinkedHashMap<>();

    @Builder.Default
    private Map<String, Integer> prizeDistribution = new LinkedHashMap<>();

    @Builder.Default
    private List<String> evidenceAlerts = new ArrayList<>();

    private LotteryDecisionPerformanceDelta ruleDelta;

    private LotteryDecisionPerformanceDelta sourceDelta;

    private BigDecimal backtestNetResultDelta;

    private BigDecimal backtestRoiPercentDelta;

    @Builder.Default
    private List<String> backtestWarnings = new ArrayList<>();

    @Builder.Default
    private List<LotteryDecisionCandidateOutcome> candidates = new ArrayList<>();

    private Long createdAt;

    private Long updatedAt;
}
