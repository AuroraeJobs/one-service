package com.one.record.service;

import com.one.record.model.LotteryRecordSyncLog;

import java.util.List;

public interface ILotteryRecordSyncLogService {

    LotteryRecordSyncLog start(String jobName, String startIssue);

    LotteryRecordSyncLog success(LotteryRecordSyncLog log, String endIssue, int savedCount, String message);

    LotteryRecordSyncLog failure(LotteryRecordSyncLog log, String message);

    LotteryRecordSyncLog skipped(String jobName, String startIssue, String message);

    List<LotteryRecordSyncLog> findRecent(String status, int limit);
}
