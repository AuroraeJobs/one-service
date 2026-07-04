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
public class LotterySimulationResult implements Serializable {

    private String targetIssue;

    private Integer candidateCount;

    private BigDecimal proposedCost;

    private BigDecimal budgetLimit;

    private String riskLevel;

    private BigDecimal roiReference;

    private Integer replayWindow;

    private LotteryTicketBudgetPrecheckResult budgetPrecheck;

    @Builder.Default
    private List<Candidate> candidates = new ArrayList<>();

    @Builder.Default
    private List<String> warnings = new ArrayList<>();

    @Builder.Default
    private Map<String, Integer> hitDistribution = new LinkedHashMap<>();

    @Builder.Default
    private Map<String, Integer> prizeDistribution = new LinkedHashMap<>();

    @Builder.Default
    private List<LotteryStrategyPortfolioSummary> portfolios = new ArrayList<>();

    private Long generatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Candidate implements Serializable {

        private String key;

        private String title;

        @Builder.Default
        private List<String> redNumbers = new ArrayList<>();

        private String blueNumber;

        private Integer quantity;

        private BigDecimal cost;

        private Integer score;

        private String source;

        private String warning;
    }
}
