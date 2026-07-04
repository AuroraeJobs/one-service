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
public class LotteryDailyState implements Serializable {

    private String latestIssue;

    private String nextIssue;

    private String latestPredictionId;

    private DailyStateItem syncState;

    private DailyStateItem predictionState;

    private DailyStateItem ticketState;

    private DailyStateItem prizeCheckState;

    private DailyStateItem qualityState;

    @Builder.Default
    private List<String> pendingActions = new ArrayList<>();

    private Long generatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyStateItem implements Serializable {

        private String key;

        private String label;

        private String status;

        private String message;

        private String path;

        private Integer pendingCount;

        private Long updatedAt;
    }
}
