package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryTicketPrizeCheckSummary {

    private String issue;

    private Integer checkedTicketCount;

    private Integer winningTicketCount;

    private Long totalPrizeAmount;

    private Long generatedAt;
}
