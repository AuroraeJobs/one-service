package com.one.record.service;

import com.one.record.model.LotteryPreference;

public interface ILotteryPreferenceService {

    LotteryPreference preference();

    LotteryPreference updatePreference(LotteryPreference preference);
}
