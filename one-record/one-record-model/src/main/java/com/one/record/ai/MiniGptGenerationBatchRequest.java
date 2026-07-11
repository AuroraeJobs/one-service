package com.one.record.ai;

import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
public class MiniGptGenerationBatchRequest implements Serializable {

    private String runName;

    private String prompt = "target=next";

    private Integer maxNewTokens;

    private Double temperature;

    private Integer topK;

    private Integer candidateCount = 8;

    private Long baseSeed = 42L;

    private Integer maxRedOverlap = 3;

    private Integer minimumBlueCoverage;

    private List<String> strategies = new ArrayList<>();
}
