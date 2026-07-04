package com.one.record.model;

import com.one.record.training.LotteryTrainingReport;
import com.one.record.training.PredictionRuleConfig;
import com.one.record.lottery.LotteryBacktestSummary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lottery_prediction_rules")
public class LotteryPredictionRuleRecord {

    @Id
    private String id;

    private String ruleId;

    private String ruleName;

    private Integer generation;

    private Integer replayCount;

    private Integer rankScore;

    private PredictionRuleConfig config;

    private LotteryTrainingReport.TrainingSummary summary;

    private LotteryBacktestSummary backtestSummary;

    private Boolean learned;

    private Long createdAt;
}
