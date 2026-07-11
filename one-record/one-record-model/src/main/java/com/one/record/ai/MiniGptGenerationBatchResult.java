package com.one.record.ai;

import lombok.Builder;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class MiniGptGenerationBatchResult implements Serializable {

    private String batchId;

    private String runId;

    private String runName;

    private String corpusVersion;

    private String trainSha256;

    private String validationSha256;

    private String checkpoint;

    private String checkpointSha256;

    @Builder.Default
    private Map<String, Object> modelConfig = new LinkedHashMap<>();

    private Integer requestedCount;

    private Long baseSeed;

    private Integer maxRedOverlap;

    private Integer minimumBlueCoverage;

    private Boolean minimumBlueCoverageMet;

    @Builder.Default
    private List<String> requestedStrategies = new ArrayList<>();

    private Integer generatedCount;

    private Double generatedRate;

    private Integer parseableCount;

    private Double parseableRate;

    private Integer legalCount;

    private Double legalRate;

    private Integer repairedCount;

    private Double repairedRate;

    private Integer postRepairLegalCount;

    private Double postRepairLegalRate;

    @Builder.Default
    private Map<String, Integer> repairReasonCounts = new LinkedHashMap<>();

    private Integer redOverlapMax;

    private Double redOverlapAverage;

    private Integer distinctBlueCount;

    private Double blueCoverage;

    @Builder.Default
    private Map<String, Integer> strategyComposition = new LinkedHashMap<>();

    @Builder.Default
    private List<MiniGptGenerationResult> items = new ArrayList<>();

    private Long generatedAt;
}
