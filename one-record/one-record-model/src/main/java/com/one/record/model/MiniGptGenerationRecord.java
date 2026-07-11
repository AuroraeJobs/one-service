package com.one.record.model;

import com.one.record.ai.MiniGptLotteryCandidateValidation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "mini_gpt_generations")
@CompoundIndexes({
        @CompoundIndex(name = "run_generated_at", def = "{'runId': 1, 'generatedAt': -1}"),
        @CompoundIndex(name = "batch_generated_at", def = "{'batchId': 1, 'generatedAt': 1}")
})
public class MiniGptGenerationRecord {

    @Id
    private String id;

    @Indexed(unique = true)
    private String generationId;

    private String batchId;

    private String runId;

    private String runName;

    private String corpusVersion;

    private String trainSha256;

    private String validationSha256;

    private String trainFirstIssue;

    private String trainLatestIssue;

    private String validationFirstIssue;

    private String validationLatestIssue;

    private String checkpoint;

    private String checkpointSha256;

    @Builder.Default
    private Map<String, Object> modelConfig = new LinkedHashMap<>();

    private String prompt;

    private String generatedText;

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
