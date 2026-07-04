package com.one.record.service;

import com.one.record.lottery.LotteryIssueLedger;
import com.one.record.lottery.LotteryLedgerSummary;
import com.one.record.lottery.LotteryMonthlyLedger;
import com.one.record.lottery.LotteryPerformanceLedger;

import java.util.List;

public interface ILotteryLedgerService {

    LotteryLedgerSummary summary();

    List<LotteryIssueLedger> issues();

    List<LotteryMonthlyLedger> months();

    List<LotteryPerformanceLedger> performance(String dimension);
}
