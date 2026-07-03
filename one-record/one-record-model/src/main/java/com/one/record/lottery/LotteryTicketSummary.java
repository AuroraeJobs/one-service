package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryTicketSummary implements Serializable {

    private Integer ticketCount;

    private Integer checkedTicketCount;

    private Integer pendingTicketCount;

    private Integer winningTicketCount;

    private BigDecimal totalCost;

    private Long totalPrizeAmount;

    @Builder.Default
    private Map<String, Integer> statusDistribution = new LinkedHashMap<>();

    @Builder.Default
    private Map<String, Integer> prizeDistribution = new LinkedHashMap<>();

    private Long generatedAt;
}
