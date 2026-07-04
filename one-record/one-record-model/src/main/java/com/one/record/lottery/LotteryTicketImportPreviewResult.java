package com.one.record.lottery;

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
public class LotteryTicketImportPreviewResult implements Serializable {

    private Integer requestedCount;

    private Integer validCount;

    private Integer invalidCount;

    private Integer duplicateExistingCount;

    private Integer duplicateRequestCount;

    @Builder.Default
    private List<LotteryTicketImportPreviewRow> rows = new ArrayList<>();

    private LotteryTicketBudgetPrecheckResult budgetPrecheck;

    private Long generatedAt;
}
