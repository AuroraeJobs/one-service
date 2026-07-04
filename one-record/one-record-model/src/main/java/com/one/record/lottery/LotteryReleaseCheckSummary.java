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
public class LotteryReleaseCheckSummary implements Serializable {

    private String status;

    private Integer passedCount;

    private Integer warningCount;

    private Integer totalCount;

    @Builder.Default
    private List<CheckItem> checks = new ArrayList<>();

    private String message;

    private Long generatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckItem implements Serializable {

        private String key;

        private String label;

        private String status;

        private String message;

        private String path;

        private Integer pendingCount;
    }
}
