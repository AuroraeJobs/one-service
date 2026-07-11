package com.one.record.lottery;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LotteryResearchProvenance implements Serializable {

    private String sourceType;

    private String generationId;

    private String batchId;

    private String runId;

    private String runName;

    private String corpusVersion;

    private String trainSha256;

    private String validationSha256;

    private String checkpointSha256;

    private String prompt;

    private Integer maxNewTokens;

    private Double temperature;

    private Integer topK;

    private Long seed;

    private String strategyLabel;

    private String trainFirstIssue;

    private String trainLatestIssue;

    private String validationFirstIssue;

    private String validationLatestIssue;

    private Long batchBaseSeed;

    private Integer batchMaxRedOverlap;

    private Integer batchMinimumBlueCoverage;

    private Boolean batchMinimumBlueCoverageMet;

    @Builder.Default
    private List<String> batchStrategies = new ArrayList<>();

    @Builder.Default
    private Map<String, Object> modelConfig = new LinkedHashMap<>();

    private Long capturedAt;
}
