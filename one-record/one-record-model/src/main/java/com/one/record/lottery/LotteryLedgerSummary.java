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
public class LotteryLedgerSummary implements Serializable {

    private Integer ticketCount;

    private Integer checkedTicketCount;

    private Integer pendingTicketCount;

    private Integer winningTicketCount;

    private BigDecimal totalCost;

    private BigDecimal totalPrize;

    private BigDecimal netResult;

    private BigDecimal roiPercent;

    private BigDecimal rollingThirtyDayCost;

    private BigDecimal rollingThirtyDayPrize;

    private BigDecimal rollingThirtyDayNetResult;

    private BigDecimal rollingThirtyDayRoiPercent;

    private BigDecimal maxDrawdown;

    private BigDecimal currentDrawdown;

    private Long generatedAt;
}
