package com.one.record.service;

import com.one.record.lottery.LotteryWorkbenchDailyRunResult;
import com.one.record.lottery.LotteryWorkbenchSummary;
import com.one.record.lottery.LotteryDailyState;

public interface ILotteryWorkbenchService {

    LotteryWorkbenchSummary summary();

    LotteryDailyState dailyState();

    LotteryWorkbenchDailyRunResult dailyRun();
}
