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
public class LotteryDailyOperationSummary implements Serializable {

    private String status;

    private Integer completedCount;

    private Integer warningCount;

    private Integer pendingCount;

    private Integer totalCount;

    @Builder.Default
    private List<String> pendingActions = new ArrayList<>();

    private Integer qualityIssueCount;

    private Integer pendingPrizeTicketCount;

    private Integer activeReminderCount;

    private Integer latestPredictionAttachmentCount;

    private Long lastSyncFinishedAt;

    private Long lastPrizeCheckAt;

    private String message;

    private Long generatedAt;
}
