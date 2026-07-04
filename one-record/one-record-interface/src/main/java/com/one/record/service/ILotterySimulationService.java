package com.one.record.service;

import com.one.record.lottery.LotterySimulationRequest;
import com.one.record.lottery.LotterySimulationResult;

public interface ILotterySimulationService {

    LotterySimulationResult simulate(LotterySimulationRequest request);
}
