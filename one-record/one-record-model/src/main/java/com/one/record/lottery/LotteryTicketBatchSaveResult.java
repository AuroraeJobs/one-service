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
public class LotteryTicketBatchSaveResult {

    private Integer requestedCount;

    private Integer savedCount;

    private Integer duplicateCount;

    @Builder.Default
    private List<LotteryTicket> savedTickets = new ArrayList<>();

    @Builder.Default
    private List<LotteryTicket> duplicateTickets = new ArrayList<>();

    private Long generatedAt;
}
