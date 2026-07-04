package com.one.record.service;

import com.one.record.lottery.LotteryMaintenanceSummary;

public interface ILotteryMaintenanceService {

    LotteryMaintenanceSummary summary();

    LotteryMaintenanceSummary cleanupDryRun();
}
