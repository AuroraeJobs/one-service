package com.one.record.ai;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class MiniGptGenerationComparisonRequest implements Serializable {

    private String runName;

    private String prompt = "语言模型";

    private Integer maxNewTokens;

    private List<Double> temperatures;

    private List<Integer> topKs;

    private Long baseSeed = 42L;
}
