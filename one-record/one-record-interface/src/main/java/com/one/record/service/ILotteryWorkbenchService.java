package com.one.record.service;

import com.one.record.lottery.LotteryWorkbenchDailyRunResult;
import com.one.record.lottery.LotteryWorkbenchSummary;

public interface ILotteryWorkbenchService {

    LotteryWorkbenchSummary summary();

    LotteryWorkbenchDailyRunResult dailyRun();
}
