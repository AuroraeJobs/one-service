package com.one.record.service;

import com.one.record.lottery.LotteryOutcomeAttribution;

import java.util.List;

public interface ILotteryOutcomeAttributionService {

    List<LotteryOutcomeAttribution> recent(Integer limit);

    LotteryOutcomeAttribution issue(String issue);
}
