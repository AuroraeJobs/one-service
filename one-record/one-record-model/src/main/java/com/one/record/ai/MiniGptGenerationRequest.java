package com.one.record.ai;

import lombok.Data;

import java.io.Serializable;

@Data
public class MiniGptGenerationRequest implements Serializable {

    private String runName;

    private String prompt = "语言模型";

    private Integer maxNewTokens;

    private Double temperature;

    private Integer topK;

    private Long seed = 42L;
}
