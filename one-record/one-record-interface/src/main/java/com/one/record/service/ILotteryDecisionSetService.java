package com.one.record.service;

import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryDecisionOutcomeSummary;
import com.one.record.lottery.LotteryDecisionReviewRequest;
import com.one.record.lottery.LotteryMiniGptDecisionSetCreateRequest;
import com.one.record.model.LotteryDecisionSet;

public interface ILotteryDecisionSetService {

    LotteryPageResponse<LotteryDecisionSet> decisionSets(Boolean includeArchived, Integer page, Integer pageSize);

    LotteryDecisionOutcomeSummary outcomeSummary(Boolean includeArchived, Integer limit);

    LotteryDecisionSet createDecisionSet(LotteryDecisionSet decisionSet);

    LotteryDecisionSet createMiniGptDecisionSet(LotteryMiniGptDecisionSetCreateRequest request);

    LotteryDecisionSet updateDecisionSet(String id, LotteryDecisionSet decisionSet);

    LotteryDecisionSet archiveDecisionSet(String id);

    LotteryDecisionSet reviewDecisionSet(String id, LotteryDecisionReviewRequest request);
}
