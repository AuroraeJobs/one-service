package com.one.record.service;

import com.one.record.lottery.LotteryIssueLedger;
import com.one.record.lottery.LotteryLedgerSummary;
import com.one.record.lottery.LotteryMonthlyLedger;

import java.util.List;

public interface ILotteryLedgerService {

    LotteryLedgerSummary summary();

    List<LotteryIssueLedger> issues();

    List<LotteryMonthlyLedger> months();
}
