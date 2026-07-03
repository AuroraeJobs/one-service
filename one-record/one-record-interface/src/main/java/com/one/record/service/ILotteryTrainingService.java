package com.one.record.service;

import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.training.LotteryActualRecord;
import com.one.record.training.LotteryTrainingReport;
import com.one.record.training.LotteryLatestPrediction;
import com.one.record.training.LotteryTrainingStatus;
import com.one.record.training.PredictionRuleConfig;

import java.util.List;

public interface ILotteryTrainingService {

    LotteryTrainingReport train(int replayCount, String scale);

    LotteryTrainingStatus startTraining(int replayCount, String scale);

    LotteryTrainingStatus trainingStatus();

    PredictionRuleConfig bestRule();

    LotteryLatestPrediction latestPrediction();

    LotteryActualRecord latestActualRecord();

    LotteryActualRecord saveLatestActualRecord(LotteryActualRecord record);

    List<LotteryPredictionSnapshot> predictionHistory(Integer limit);

    LotteryPredictionSnapshot predictionDetail(String id);
}
