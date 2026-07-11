package com.one.record.lottery;

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
public class LotteryPerformanceLedger implements Serializable {

    private String dimension;

    private String key;

    private String name;

    private Integer ticketCount;

    private Integer checkedTicketCount;

    private Integer pendingTicketCount;

    private Integer winningTicketCount;

    private BigDecimal totalCost;

    private BigDecimal totalPrize;

    private BigDecimal netResult;

    private BigDecimal roiPercent;

    private BigDecimal hitRatePercent;

    private LotteryBacktestSummary backtestSummary;

    @Builder.Default
    private List<LotteryResearchProvenance> provenance = new ArrayList<>();
}
