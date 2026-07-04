package com.one.record.service;

import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryStrategyPortfolioSummary;
import com.one.record.model.LotteryStrategyPortfolio;

public interface ILotteryStrategyPortfolioService {

    LotteryPageResponse<LotteryStrategyPortfolioSummary> portfolios(Boolean includeArchived, Integer page, Integer pageSize);

    LotteryStrategyPortfolioSummary detail(String id);

    LotteryStrategyPortfolioSummary create(LotteryStrategyPortfolio portfolio);

    LotteryStrategyPortfolioSummary update(String id, LotteryStrategyPortfolio portfolio);

    LotteryStrategyPortfolioSummary archive(String id);
}
