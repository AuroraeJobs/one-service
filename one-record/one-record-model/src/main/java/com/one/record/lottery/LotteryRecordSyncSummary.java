package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryRecordSyncSummary {

    private Integer totalCount;

    private Integer successCount;

    private Integer failedCount;

    private Integer skippedCount;

    private Integer runningCount;

    private BigDecimal successRate;

    private BigDecimal failedRate;

    private Integer savedCount;

    private String latestJobName;

    private String latestStatus;

    private String latestMessage;

    private String latestStartIssue;

    private String latestEndIssue;

    private Long latestStartedAt;

    private Long latestFinishedAt;

    private Long latestDurationMs;

    private Long averageDurationMs;

    private Long lastSuccessAt;

    private Long lastFailureAt;

    private Long lastSkippedAt;

    private Long generatedAt;
}
