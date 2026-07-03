package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryStatisticsSummary implements Serializable {

    private long totalDraws;

    private String firstIssue;

    private String latestIssue;

    private String firstDrawDate;

    private String latestDrawDate;

    private LotteryDraw firstDraw;

    private LotteryDraw latestDraw;

    private List<NumberFrequency> redFrequency;

    private List<NumberFrequency> blueFrequency;

    private List<DistributionItem> redSumDistribution;

    private List<DistributionItem> oddCountDistribution;

    private List<DistributionItem> bigCountDistribution;

    private List<DistributionItem> spanDistribution;

    private Long generatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NumberFrequency implements Serializable {

        private String number;

        private int count;

        private double percent;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DistributionItem implements Serializable {

        private String value;

        private int count;

        private double percent;
    }
}
