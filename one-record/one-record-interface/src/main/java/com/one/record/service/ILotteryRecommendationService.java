package com.one.record.service;

import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryRecommendationRollup;
import com.one.record.lottery.LotteryRecommendationStatusRequest;
import com.one.record.model.LotteryRecommendation;

public interface ILotteryRecommendationService {

    LotteryPageResponse<LotteryRecommendation> recommendations(String recommendationState, Integer page, Integer pageSize);

    LotteryRecommendation detail(String id);

    LotteryRecommendationRollup rollup(String window, Integer limit);

    LotteryPageResponse<LotteryRecommendation> refresh(Integer limit);

    LotteryRecommendation updateStatus(String id, LotteryRecommendationStatusRequest request);
}
