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
public class LotteryOutcomeAttributionRollup implements Serializable {

    private String window;

    private Integer requestedLimit;

    private Integer issueCount;

    private Integer ticketCount;

    private Integer checkedTicketCount;

    private Integer winningTicketCount;

    private BigDecimal totalCost;

    private BigDecimal totalPrize;

    private BigDecimal netResult;

    private BigDecimal roiPercent;

    @Builder.Default
    private Map<String, Integer> calibrationDistribution = new LinkedHashMap<>();

    @Builder.Default
    private List<RollupRow> rows = new ArrayList<>();

    private Long generatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RollupRow implements Serializable {

        private String dimension;

        private String key;

        private String label;

        private Integer issueCount;

        private Integer sampleCount;

        private Integer warningCount;

        private BigDecimal netResult;

        private BigDecimal roiPercent;

        private String state;

        private String evidenceQuality;

        private String path;
    }
}
