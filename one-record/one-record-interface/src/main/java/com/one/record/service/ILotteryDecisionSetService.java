package com.one.record.service;

import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryDecisionSet;

public interface ILotteryDecisionSetService {

    LotteryPageResponse<LotteryDecisionSet> decisionSets(Boolean includeArchived, Integer page, Integer pageSize);

    LotteryDecisionSet createDecisionSet(LotteryDecisionSet decisionSet);

    LotteryDecisionSet updateDecisionSet(String id, LotteryDecisionSet decisionSet);

    LotteryDecisionSet archiveDecisionSet(String id);
}
