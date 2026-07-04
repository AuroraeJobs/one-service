package com.one.record.service;

import com.one.record.lottery.LotteryExperimentRunRequest;
import com.one.record.lottery.LotteryExperimentUpdateRequest;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryStrategyExperiment;

public interface ILotteryExperimentService {

    LotteryStrategyExperiment runExperiment(LotteryExperimentRunRequest request);

    LotteryPageResponse<LotteryStrategyExperiment> experiments(Integer page,
                                                               Integer pageSize,
                                                               String strategyName,
                                                               String tag,
                                                               Long createdStartAt,
                                                               Long createdEndAt);

    LotteryStrategyExperiment detail(String id);

    LotteryStrategyExperiment updateNotes(String id, LotteryExperimentUpdateRequest request);
}
