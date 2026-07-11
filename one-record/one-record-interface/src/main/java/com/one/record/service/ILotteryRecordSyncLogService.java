package com.one.record.service;

import com.one.record.lottery.LotteryRecordSyncSummary;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryRecordSyncLog;

import java.util.List;

public interface ILotteryRecordSyncLogService {

    LotteryRecordSyncLog start(String jobName, String startIssue);

    LotteryRecordSyncLog success(LotteryRecordSyncLog log, String endIssue, int savedCount, String message);

    LotteryRecordSyncLog failure(LotteryRecordSyncLog log, String message);

    default LotteryRecordSyncLog failure(LotteryRecordSyncLog log, Throwable exception) {
        return failure(log, exception == null ? null : exception.getMessage());
    }

    LotteryRecordSyncLog skipped(String jobName, String startIssue, String message);

    List<LotteryRecordSyncLog> findRecent(String status, int limit);

    LotteryPageResponse<LotteryRecordSyncLog> findPage(String status, Long startedStartAt, Long startedEndAt, Integer page, Integer pageSize);

    void delete(String id);

    LotteryRecordSyncSummary summary(int limit);
}
