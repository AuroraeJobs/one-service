package com.one.record.service;

import com.one.record.lottery.LotteryProviderConfig;
import com.one.record.lottery.LotteryProviderHealth;
import com.one.record.lottery.LotteryProviderProbeResult;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryProviderProbeLog;

import java.util.List;

public interface ILotteryProviderService {

    List<LotteryProviderHealth> health();

    LotteryProviderConfig config();

    LotteryProviderProbeResult probe(String provider);

    List<LotteryProviderProbeLog> probeLogs(String provider, int limit);

    LotteryPageResponse<LotteryProviderProbeLog> probeLogPage(String provider,
                                                              Boolean success,
                                                              Long checkedStartAt,
                                                              Long checkedEndAt,
                                                              Integer page,
                                                              Integer pageSize);
}
