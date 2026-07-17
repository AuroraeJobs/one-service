package com.one.record.service;

import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.model.LotteryPredictionRuleRecord;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.training.LotteryActualRecord;
import com.one.record.training.LotteryReplayMetrics;
import com.one.record.training.LotteryRuleComparison;
import com.one.record.training.LotteryTrainingReport;
import com.one.record.training.LotteryLatestPrediction;
import com.one.record.training.LotteryTrainingStatus;
import com.one.record.training.PredictionRuleConfig;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

public interface ILotteryTrainingService {

    LotteryTrainingReport train(int replayCount, String scale);

    LotteryTrainingStatus startTraining(int replayCount, String scale);

    LotteryTrainingStatus trainingStatus();

    SseEmitter streamStatus();

    LotteryTrainingStatus cancelTraining();

    LotteryTrainingStatus retryTraining();

    PredictionRuleConfig bestRule();

    LotteryLatestPrediction latestPrediction();

    LotteryActualRecord latestActualRecord();

    LotteryActualRecord saveLatestActualRecord(LotteryActualRecord record);

    List<LotteryPredictionSnapshot> predictionHistory(Integer limit);

    LotteryPageResponse<LotteryPredictionSnapshot> predictionHistoryPage(Integer page,
                                                                         Integer pageSize,
                                                                         String resultState,
                                                                         Integer targetPeriod,
                                                                         String ruleId,
                                                                         String ruleName);

    LotteryPredictionSnapshot predictionDetail(String id);

    LotteryPredictionSnapshot attachPredictionActual(String id, LotteryActualRecord record);

    List<LotteryPredictionSnapshot> attachLatestActualToMatchingPredictions();

    List<LotteryPredictionRuleRecord> predictionRules(Integer limit);

    LotteryRuleComparison comparePredictionRules(Integer limit);

    LotteryReplayMetrics replayMetrics(Integer window);
}
