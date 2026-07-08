package com.one.record.model;

import com.one.record.lottery.LotteryAuditMetadata;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

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
@Document(collection = "lottery_backtest_reports")
public class LotteryBacktestReport implements Serializable {

    @Id
    private String id;

    private String experimentId;

    private String strategyName;

    private String presetWindow;

    private Integer requestedWindow;

    private String issueStart;

    private String issueEnd;

    private Integer replayCount;

    private BigDecimal averageRedHits;

    private BigDecimal blueHitRate;

    private BigDecimal baselineAverageRedHits;

    private BigDecimal baselineBlueHitRate;

    private Integer bestScore;

    private Integer stabilityScore;

    private BigDecimal totalCost;

    private BigDecimal totalPrize;

    private BigDecimal netResult;

    @Builder.Default
    private Map<String, Integer> prizeDistribution = new LinkedHashMap<>();

    @Builder.Default
    private Map<String, Integer> baselinePrizeDistribution = new LinkedHashMap<>();

    @Builder.Default
    private List<ReplayRow> rows = new ArrayList<>();

    @Builder.Default
    private List<BankrollPoint> bankrollSimulation = new ArrayList<>();

    private LotteryAuditMetadata auditMetadata;

    private Long createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReplayRow implements Serializable {

        private String issue;

        private String drawDate;

        @Builder.Default
        private List<String> predictedRedNumbers = new ArrayList<>();

        private String predictedBlueNumber;

        @Builder.Default
        private List<String> actualRedNumbers = new ArrayList<>();

        private String actualBlueNumber;

        private Integer redHits;

        private Boolean blueHit;

        private String prizeName;

        private Integer score;

        private BigDecimal cost;

        private BigDecimal prize;

        private BigDecimal netResult;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BankrollPoint implements Serializable {

        private String issue;

        private BigDecimal balance;
    }
}
