package com.one.record.service;

import com.one.record.lottery.LotteryDataQualityReport;
import com.one.record.lottery.LotteryDataQualityRepairRequest;
import com.one.record.lottery.LotteryDataQualityRepairResult;

public interface ILotteryDataQualityService {

    LotteryDataQualityReport report();

    LotteryDataQualityRepairResult dryRunMissingIssuesRepair(LotteryDataQualityRepairRequest request);

    LotteryDataQualityRepairResult confirmMissingIssuesRepair(LotteryDataQualityRepairRequest request);
}
