package com.one.record.model;

import com.one.record.training.LotteryActualRecord;
import com.one.record.training.LotteryLatestPrediction;
import com.one.record.training.LotteryTrainingReport;
import com.one.record.training.PredictionRuleConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lottery_training_reports")
public class LotteryTrainingReportRecord {

    @Id
    private String id;

    private Integer replayCount;

    private Integer generation;

    private LotteryTrainingReport.TrainingResult best;

    private PredictionRuleConfig learnedRule;

    private LotteryLatestPrediction latestPrediction;

    private LotteryActualRecord actualRecord;

    @Builder.Default
    private List<LotteryTrainingReport.TrainingResult> candidates = new ArrayList<>();

    @Builder.Default
    private List<LotteryTrainingReport.TrainingTimelineItem> timeline = new ArrayList<>();

    private Long createdAt;

    private Long updatedAt;
}
