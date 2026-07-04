package com.one.record.model;

import com.one.record.training.LotteryLatestPrediction;
import com.one.record.training.LotteryPredictionCandidate;
import com.one.record.training.LotteryTrainingReport;
import com.one.record.training.PredictionRuleConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lottery_strategy_experiments")
public class LotteryStrategyExperiment {

    @Id
    private String id;

    private String strategyName;

    private String scale;

    private Integer replayWindow;

    private String inputSource;

    private PredictionRuleConfig bestRule;

    private LotteryTrainingReport.TrainingSummary outcomeSummary;

    @Builder.Default
    private Map<String, Integer> scoreDistribution = new LinkedHashMap<>();

    @Builder.Default
    private List<LotteryPredictionCandidate> generatedCandidates = new ArrayList<>();

    private LotteryLatestPrediction latestPrediction;

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    private String notes;

    private Long createdAt;

    private Long updatedAt;
}
