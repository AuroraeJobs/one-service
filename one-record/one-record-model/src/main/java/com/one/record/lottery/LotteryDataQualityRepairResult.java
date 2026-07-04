package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryDataQualityRepairResult {

    private String repairType;

    private Boolean dryRun;

    private Integer missingBefore;

    private Integer missingAfter;

    private Integer requestedIssueCount;

    private Integer repairableIssueCount;

    private Integer repairedIssueCount;

    private Integer skippedIssueCount;

    private String message;

    @Builder.Default
    private List<String> requestedIssues = new ArrayList<>();

    @Builder.Default
    private List<String> repairableIssues = new ArrayList<>();

    @Builder.Default
    private List<String> repairedIssues = new ArrayList<>();

    @Builder.Default
    private List<String> skippedIssues = new ArrayList<>();

    private Long generatedAt;
}
