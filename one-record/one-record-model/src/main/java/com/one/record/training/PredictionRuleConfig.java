package com.one.record.training;

import lombok.Data;

import java.io.Serializable;

@Data
public class PredictionRuleConfig implements Serializable {

    private String id;

    private String name;

    private int recentWindow = 20;

    private double activeWeight = 1.0;

    private double omissionWeight = 1.0;

    private double balancedWeight = 1.0;

    private double blueOmissionWeight = 1.0;

    private double averageDiffWeight = 1.0;

    private double squaredDiffWeight = 1.0;

    private double oddEvenProbabilityWeight = 1.0;

    private int targetOddCount = 3;

    private int targetBigCount = 3;

    private boolean requireZoneCoverage = true;

    private boolean avoidLastDraw;

    public static PredictionRuleConfig defaultConfig() {
        PredictionRuleConfig config = new PredictionRuleConfig();
        config.setId("default");
        config.setName("默认综合规则");
        return config;
    }
}
