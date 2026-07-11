package com.one.record.ai;

import lombok.Builder;
import lombok.Data;

import java.io.Serializable;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class MiniGptGenerationResult implements Serializable {

    private String generationId;

    private String batchId;

    private String runId;

    private String runName;

    private String prompt;

    private String generatedText;

    private String checkpoint;

    private String checkpointSha256;

    private String corpusVersion;

    private String trainSha256;

    private String validationSha256;

    private String trainFirstIssue;

    private String trainLatestIssue;

    private String validationFirstIssue;

    private String validationLatestIssue;

    @Builder.Default
    private Map<String, Object> modelConfig = new LinkedHashMap<>();

    private Integer maxNewTokens;

    private Double temperature;

    private Integer topK;

    private Long seed;

    private String strategyLabel;

    private Boolean poolSelected;

    private String poolDecision;

    private Long batchBaseSeed;

    private Integer batchMaxRedOverlap;

    private Integer batchMinimumBlueCoverage;

    private Boolean batchMinimumBlueCoverageMet;

    private List<String> batchStrategies;

    private Integer exitCode;

    private Long elapsedMillis;

    private MiniGptLotteryCandidateValidation lotteryCandidate;

    private Long generatedAt;
}
