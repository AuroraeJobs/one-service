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
public class LotteryOperationsHealthSummary implements Serializable {

    private Integer score;

    private String status;

    private String message;

    private String latestIssue;

    private String nextIssue;

    private Integer warningCount;

    private Integer pendingActionCount;

    @Builder.Default
    private List<LotteryOperationsHealthContributor> contributors = new ArrayList<>();

    private Long generatedAt;
}
