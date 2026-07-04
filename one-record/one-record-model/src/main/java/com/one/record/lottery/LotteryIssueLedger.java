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
public class LotteryIssueLedger implements Serializable {

    private String issue;

    private Long period;

    private Integer ticketCount;

    private Integer checkedTicketCount;

    private Integer pendingTicketCount;

    private Integer winningTicketCount;

    private BigDecimal totalCost;

    private BigDecimal totalPrize;

    private BigDecimal netResult;

    private BigDecimal roiPercent;
}
