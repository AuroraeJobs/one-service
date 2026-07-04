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
public class LotteryDataQualityReport implements Serializable {

    private Integer totalRecords;

    private Integer missingIssueCount;

    private Integer duplicateIssueCount;

    private Integer malformedRecordCount;

    private Integer invalidNumberCount;

    private Integer outOfOrderLineCount;

    private Integer futureDateCount;

    private Integer staleDerivedDataCount;

    @Builder.Default
    private List<String> missingIssues = new ArrayList<>();

    @Builder.Default
    private List<String> duplicateIssues = new ArrayList<>();

    @Builder.Default
    private List<String> malformedIssues = new ArrayList<>();

    @Builder.Default
    private List<String> outOfOrderLineIssues = new ArrayList<>();

    @Builder.Default
    private List<String> futureDateIssues = new ArrayList<>();

    @Builder.Default
    private List<String> staleDerivedDataReasons = new ArrayList<>();

    private Long generatedAt;
}
