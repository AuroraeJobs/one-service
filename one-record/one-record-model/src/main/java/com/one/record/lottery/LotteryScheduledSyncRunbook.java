package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryScheduledSyncRunbook implements Serializable {

    private Boolean enabled;

    private String cron;

    private Long lastRunAt;

    private String lastStatus;

    private Long lastDurationMs;

    private String lastFailureCategory;

    private String lastMessage;

    private Long lastSuccessAt;

    private Long lastFailureAt;

    private Long nextRunAt;

    private String nextRunText;

    private String healthStatus;

    private String message;

    private Long generatedAt;
}
