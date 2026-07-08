package com.one.record.ai;

import lombok.Data;

import java.io.Serializable;

@Data
public class MiniGptTrainingRequest implements Serializable {

    private String preset = "tiny";

    private String runName;

    private String data = "data/sample.txt";

    private Integer maxSteps;

    private Integer batchSize;

    private Double learningRate;

    private Integer blockSize;

    private Integer nEmbd;

    private Integer nHead;

    private Integer nLayer;

    private Double valRatio;

    private String samplePrompt = "语言模型";

    private Integer sampleTokens;

    private Double temperature;

    private Integer topK;
}
