package com.one.record.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "mini_gpt_runs")
public class MiniGptRunRecord {

    @Id
    private String id;

    @Indexed(unique = true)
    private String runName;

    private String preset;

    private String status;

    private String startedAt;

    private String finishedAt;

    private String data;

    private String evalData;

    private String manifestDataPath;

    private String corpusVersion;

    private String corpusFormat;

    private Integer schemaVersion;

    private String templateVersion;

    private String trainSha256;

    private String validationSha256;

    private String provenanceStatus;

    private Integer minimumSampleTokens;

    private Integer maximumSampleTokens;

    private Integer requiredBlockSize;

    private Integer recommendedBlockSize;

    private Integer effectiveBlockSize;

    private String validationSource;

    private Long seed;

    @Builder.Default
    private Map<String, Object> provenance = new LinkedHashMap<>();

    private String checkpoint;

    private String checkpointSha256;

    private String parentRunName;

    private String parentCheckpoint;

    private Integer resumeStep;

    private Integer trainStep;

    private String logFile;

    private String metadataFile;

    private String device;

    private Integer maxSteps;

    private Integer batchSize;

    private Double learningRate;

    private Double valRatio;

    private Boolean validationEnabled;

    private Integer trainTokens;

    private Integer evalTokens;

    private String samplePrompt;

    private Integer sampleTokens;

    private Double finalTrainLoss;

    private Double finalEvalLoss;

    private Double lossGap;

    private Double fixedEvalLoss;

    private Double qualityGateMaxEvalLoss;

    private Double qualityGateMaxLossGap;

    private String qualityGateStatus;

    private String qualityGateReasons;

    private String hypothesis;

    private String observation;

    private String conclusion;

    private String nextStep;

    @Builder.Default
    private Map<String, Object> config = new LinkedHashMap<>();

    private Long createdAt;

    private Long updatedAt;
}
