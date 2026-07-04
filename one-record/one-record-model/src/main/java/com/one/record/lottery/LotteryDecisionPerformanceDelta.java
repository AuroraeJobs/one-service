package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryDecisionPerformanceDelta implements Serializable {

    private String dimension;

    private String key;

    private String name;

    private Integer decisionTicketCount;

    private Integer benchmarkTicketCount;

    private BigDecimal decisionNetResult;

    private BigDecimal benchmarkNetResult;

    private BigDecimal netResultDelta;

    private BigDecimal decisionRoiPercent;

    private BigDecimal benchmarkRoiPercent;

    private BigDecimal roiPercentDelta;

    private BigDecimal decisionHitRatePercent;

    private BigDecimal benchmarkHitRatePercent;

    private BigDecimal hitRatePercentDelta;

    private Integer backtestStabilityScore;

    private BigDecimal backtestAverageRedHits;

    private BigDecimal backtestBlueHitRate;
}
