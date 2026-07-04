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
public class LotteryCalendarState implements Serializable {

    private String latestIssue;

    private String nextIssue;

    private String nextDrawDate;

    private String drawWeekday;

    private Long expectedSyncStartAt;

    private Long expectedSyncEndAt;

    private String currentIssueState;

    @Builder.Default
    private List<Reminder> reminders = new ArrayList<>();

    private Long generatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Reminder implements Serializable {

        private String key;

        private String label;

        private String status;

        private String message;

        private String path;

        private String fingerprint;

        private Long dueAt;

        private boolean acknowledged;
    }
}
