package com.one.record.lottery;

import com.one.record.model.LotteryTicket;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryTicketBulkOperationResult implements Serializable {

    private Integer requestedCount;

    private Integer updatedCount;

    private Integer archivedCount;

    private Integer deletedCount;

    @Builder.Default
    private List<String> missingIds = new ArrayList<>();

    @Builder.Default
    private List<LotteryTicket> tickets = new ArrayList<>();

    private Long generatedAt;
}
