package com.one.record.training;

import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
public class LotteryTrainingReport implements Serializable {

    private int replayCount;

    private int generation;

    private TrainingResult best;

    private PredictionRuleConfig learnedRule;

    private LotteryLatestPrediction latestPrediction;

    private LotteryActualRecord actualRecord;

    private List<TrainingResult> candidates = new ArrayList<>();

    private List<TrainingTimelineItem> timeline = new ArrayList<>();

    @Data
    public static class TrainingResult implements Serializable {

        private PredictionRuleConfig config;

        private TrainingSummary summary;

        private int rankScore;
    }

    @Data
    public static class TrainingSummary implements Serializable {

        private int total;

        private double averageScore;

        private int bestScore;

        private double averageRedHits;

        private int blueHitRate;

        private Map<String, Integer> prizeDistribution = new LinkedHashMap<>();

        private String bestStrategy;

        private List<String> improvementTips = new ArrayList<>();
    }

    @Data
    public static class TrainingTimelineItem implements Serializable {

        private int period;

        private List<String> predictedRedNumbers = new ArrayList<>();

        private String predictedBlueNumber;

        private List<String> actualRedNumbers = new ArrayList<>();

        private String actualBlueNumber;

        private int redHits;

        private boolean blueHit;

        private String prizeName;

        private int score;

        private String strategy;

        private String beforeRuleName;

        private String afterRuleName;

        private String adjustment;
    }
}
