package com.one.record.lottery;

import com.one.record.model.LotteryTicket;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryTicketBudgetPrecheckRequest {

    @Builder.Default
    private List<LotteryTicket> tickets = new ArrayList<>();
}
