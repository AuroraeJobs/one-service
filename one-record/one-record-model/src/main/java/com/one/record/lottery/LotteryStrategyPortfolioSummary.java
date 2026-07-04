package com.one.record.lottery;

import com.one.record.model.LotteryStrategyPortfolio;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryStrategyPortfolioSummary implements Serializable {

    private LotteryStrategyPortfolio portfolio;

    private Integer healthScore;

    private String healthStatus;

    private BigDecimal roiPercent;

    private Integer warningCount;

    private Integer replayCount;

    private Integer evidenceCoveragePercent;

    private Integer ruleCount;

    private Integer experimentCount;

    private Integer backtestCount;

    private Integer decisionCount;

    private Integer noteCount;

    private BigDecimal allocationWeight;

    @Builder.Default
    private List<EvidenceSummary> evidence = new ArrayList<>();

    private Long generatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvidenceSummary implements Serializable {

        private String evidenceType;

        private String sourceId;

        private String title;

        private String path;

        private BigDecimal allocationWeight;

        private String status;

        private BigDecimal roiPercent;

        private Integer warningCount;

        private Integer replayCount;

        private Long updatedAt;
    }
}
