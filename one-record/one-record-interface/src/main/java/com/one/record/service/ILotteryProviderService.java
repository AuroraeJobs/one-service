package com.one.record.service;

import com.one.record.lottery.LotteryProviderConfig;
import com.one.record.lottery.LotteryProviderHealth;
import com.one.record.lottery.LotteryProviderProbeResult;

import java.util.List;

public interface ILotteryProviderService {

    List<LotteryProviderHealth> health();

    LotteryProviderConfig config();

    LotteryProviderProbeResult probe(String provider);
}
