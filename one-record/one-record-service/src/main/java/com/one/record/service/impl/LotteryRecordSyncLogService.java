package com.one.record.service.impl;

import com.one.record.model.LotteryRecordSyncLog;
import com.one.record.repository.LotteryRecordSyncLogRepository;
import com.one.record.service.ILotteryRecordSyncLogService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;

@Service
@AllArgsConstructor
public class LotteryRecordSyncLogService implements ILotteryRecordSyncLogService {

    private static final int DEFAULT_LIMIT = 50;

    private static final int MAX_LIMIT = 200;

    private final LotteryRecordSyncLogRepository repository;

    @Override
    public LotteryRecordSyncLog start(String jobName, String startIssue) {
        return repository.save(LotteryRecordSyncLog.builder()
                .jobName(jobName)
                .status("RUNNING")
                .startIssue(startIssue)
                .startedAt(System.currentTimeMillis())
                .message("开奖记录同步已启动")
                .build());
    }

    @Override
    public LotteryRecordSyncLog success(LotteryRecordSyncLog log, String endIssue, int savedCount, String message) {
        LotteryRecordSyncLog target = log == null ? start("manual-record-sync", null) : log;
        target.setStatus("SUCCESS");
        target.setEndIssue(endIssue);
        target.setSavedCount(savedCount);
        target.setMessage(StringUtils.hasText(message) ? message : "开奖记录同步完成");
        target.setFinishedAt(System.currentTimeMillis());
        return repository.save(target);
    }

    @Override
    public LotteryRecordSyncLog failure(LotteryRecordSyncLog log, String message) {
        LotteryRecordSyncLog target = log == null ? start("manual-record-sync", null) : log;
        target.setStatus("FAILED");
        target.setMessage(StringUtils.hasText(message) ? message : "开奖记录同步失败");
        target.setFinishedAt(System.currentTimeMillis());
        return repository.save(target);
    }

    @Override
    public LotteryRecordSyncLog skipped(String jobName, String startIssue, String message) {
        Long now = System.currentTimeMillis();
        return repository.save(LotteryRecordSyncLog.builder()
                .jobName(jobName)
                .status("SKIPPED")
                .startIssue(startIssue)
                .savedCount(0)
                .message(StringUtils.hasText(message) ? message : "开奖记录同步已跳过")
                .startedAt(now)
                .finishedAt(now)
                .build());
    }

    @Override
    public List<LotteryRecordSyncLog> findRecent(String status, int limit) {
        PageRequest pageRequest = PageRequest.of(0, normalizeLimit(limit));
        if (StringUtils.hasText(status)) {
            return repository.findByStatusOrderByStartedAtDesc(status.trim().toUpperCase(Locale.ROOT), pageRequest);
        }
        return repository.findByOrderByStartedAtDesc(pageRequest);
    }

    private static int normalizeLimit(int limit) {
        if (limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }
}
