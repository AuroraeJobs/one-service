package com.one.record.service;

import com.one.record.lottery.LotteryOutcomeAttribution;
import com.one.record.lottery.LotteryOutcomeAttributionRollup;

import java.util.List;

public interface ILotteryOutcomeAttributionService {

    List<LotteryOutcomeAttribution> recent(Integer limit);

    LotteryOutcomeAttributionRollup rollup(String window, Integer limit);

    LotteryOutcomeAttribution issue(String issue);
}
