package com.one.record.stock;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockKLineSyncSummary {

    private String symbol;

    private Integer totalCount;

    private Integer successCount;

    private Integer failedCount;

    private Integer runningCount;

    private Integer requestedCount;

    private Integer savedCount;

    private String latestJobName;

    private String latestStatus;

    private String latestMessage;

    private Long latestStartedAt;

    private Long latestFinishedAt;

    private Long lastSuccessAt;

    private Long lastFailureAt;

    private Long generatedAt;
}
