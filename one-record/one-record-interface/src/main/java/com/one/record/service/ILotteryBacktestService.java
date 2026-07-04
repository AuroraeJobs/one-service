package com.one.record.service;

import com.one.record.lottery.LotteryBacktestRunRequest;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryBacktestReport;

public interface ILotteryBacktestService {

    LotteryBacktestReport run(LotteryBacktestRunRequest request);

    LotteryPageResponse<LotteryBacktestReport> reports(Integer page,
                                                       Integer pageSize,
                                                       String strategyName,
                                                       String presetWindow,
                                                       Long createdStartAt,
                                                       Long createdEndAt);

    LotteryBacktestReport detail(String id);
}
