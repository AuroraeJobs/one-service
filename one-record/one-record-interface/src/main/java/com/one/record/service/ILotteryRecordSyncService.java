package com.one.record.service;

import com.one.record.model.LotteryRecordSyncLog;

public interface ILotteryRecordSyncService {

    LotteryRecordSyncLog syncManually();

    LotteryRecordSyncLog syncScheduled();
}
