package com.one.record.lottery;

import com.one.record.model.LotteryTicketPack;
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
public class LotteryOutcomeAttribution implements Serializable {

    private String issue;

    private Integer ticketCount;

    private Integer checkedTicketCount;

    private Integer winningTicketCount;

    private BigDecimal totalCost;

    private BigDecimal totalPrize;

    private BigDecimal netResult;

    private BigDecimal roiPercent;

    private Integer bestRedHits;

    private Integer blueHitCount;

    private String calibrationState;

    @Builder.Default
    private Map<String, Integer> prizeDistribution = new LinkedHashMap<>();

    @Builder.Default
    private List<PortfolioContribution> portfolioContributions = new ArrayList<>();

    @Builder.Default
    private List<DecisionContribution> decisionContributions = new ArrayList<>();

    @Builder.Default
    private List<TicketPackExecution> ticketPackExecutions = new ArrayList<>();

    @Builder.Default
    private List<SimulationDrift> simulationDrifts = new ArrayList<>();

    @Builder.Default
    private List<TimelineItem> timeline = new ArrayList<>();

    private Long generatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PortfolioContribution implements Serializable {

        private String portfolioId;

        private String name;

        private Integer healthScore;

        private BigDecimal roiPercent;

        private Integer warningCount;

        private Integer linkedDecisionCount;

        private String contributionState;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DecisionContribution implements Serializable {

        private String decisionSetId;

        private String title;

        private String ruleName;

        private Integer winningCandidateCount;

        private BigDecimal netResult;

        private BigDecimal roiPercent;

        private String contributionState;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TicketPackExecution implements Serializable {

        private String packId;

        private String title;

        private String status;

        private String approvalState;

        private Integer itemCount;

        private Integer savedTicketCount;

        private BigDecimal proposedCost;

        private String executionState;

        private LotteryTicketPack sourcePack;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimulationDrift implements Serializable {

        private String auditId;

        private String targetIssue;

        private String riskLevel;

        private Integer candidateCount;

        private Integer actualWinningTicketCount;

        private String driftState;

        private Long generatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineItem implements Serializable {

        private String type;

        private String title;

        private String path;

        private String state;

        private Long timestamp;
    }
}
