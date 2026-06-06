package com.one.record.training;

import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
public class LotteryLatestPrediction implements Serializable {

    private String title;

    private List<String> redNumbers = new ArrayList<>();

    private String blueNumber;

    private int score;

    private String ruleId;

    private String ruleName;

    private int basedOnPeriod;

    private int targetPeriod;

    private String reason;

    private LotteryActualRecord actualRecord;

    private LotteryPredictionResult result;

    private List<LotteryPredictionCandidate> candidates = new ArrayList<>();
}
