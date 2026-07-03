package com.one.record.service;

import com.one.record.lottery.LotteryStatisticsSummary;

import java.util.List;
import java.util.Map;

public interface ILotteryStatisticsService {

    LotteryStatisticsSummary summary();

    LotteryStatisticsSummary refreshSummary();

    Map<String, List<LotteryStatisticsSummary.NumberFrequency>> frequency();

    Map<String, List<LotteryStatisticsSummary.DistributionItem>> distribution();

    void invalidateCache();
}
