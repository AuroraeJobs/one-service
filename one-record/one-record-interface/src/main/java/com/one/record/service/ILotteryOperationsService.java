package com.one.record.service;

import com.one.record.lottery.LotteryOperationsHealthAcknowledgeRequest;
import com.one.record.lottery.LotteryOperationsHealthSummary;

public interface ILotteryOperationsService {

    LotteryOperationsHealthSummary health();

    LotteryOperationsHealthSummary acknowledgeHealth(LotteryOperationsHealthAcknowledgeRequest request);
}
