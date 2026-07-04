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
public class LotteryDecisionOutcomeSummary implements Serializable {

    private Integer savedDecisionSetCount;

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

    private Integer warningCount;

    private Integer staleEvidenceCount;

    private Integer volatileEvidenceCount;

    private Integer underTestedEvidenceCount;

    @Builder.Default
    private Map<String, Integer> hitDistribution = new LinkedHashMap<>();

    @Builder.Default
    private Map<String, Integer> prizeDistribution = new LinkedHashMap<>();

    @Builder.Default
    private List<LotteryDecisionOutcomeItem> items = new ArrayList<>();

    private Long generatedAt;
}
