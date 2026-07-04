package com.one.record.service;

import com.one.record.lottery.LotteryProviderHealth;

import java.util.List;

public interface ILotteryProviderService {

    List<LotteryProviderHealth> health();
}
