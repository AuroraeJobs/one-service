package com.one.record.ai;

import lombok.Builder;
import lombok.Data;

import java.io.Serializable;

@Data
@Builder
public class MiniGptGenerationResult implements Serializable {

    private String runName;

    private String prompt;

    private String generatedText;

    private String checkpoint;

    private Integer maxNewTokens;

    private Double temperature;

    private Integer topK;

    private Integer exitCode;

    private Long elapsedMillis;

    private MiniGptLotteryCandidateValidation lotteryCandidate;

    private Long generatedAt;
}
