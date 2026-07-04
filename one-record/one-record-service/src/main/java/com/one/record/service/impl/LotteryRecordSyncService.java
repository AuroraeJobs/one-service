package com.one.record.service.impl;

import com.one.common.exception.ServiceException;
import com.one.record.model.LotteryRecordSyncLog;
import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.response.Record;
import com.one.record.service.ILotteryRecordSyncLogService;
import com.one.record.service.ILotteryRecordSyncService;
import com.one.record.service.ILotteryStatisticsService;
import com.one.record.service.ILotteryTrainingService;
import com.one.record.service.IRecordService;
import com.one.record.service.IRecordUpdate;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class LotteryRecordSyncService implements ILotteryRecordSyncService {

    private static final String MANUAL_JOB_NAME = "manual-record-sync";

    private static final String SCHEDULED_JOB_NAME = "scheduled-record-sync";

    private static final String SYNC_LOCK_KEY = "lottery:records:sync:lock";

    private static final Duration SYNC_LOCK_TTL = Duration.ofMinutes(10);

    private final IRecordService recordService;

    private final IRecordUpdate recordUpdate;

    private final ILotteryRecordSyncLogService syncLogService;

    private final ILotteryStatisticsService statisticsService;

    private final ILotteryTrainingService trainingService;

    private final StringRedisTemplate redisTemplate;

    @Override
    public LotteryRecordSyncLog syncManually() {
        return sync(MANUAL_JOB_NAME);
    }

    @Override
    public LotteryRecordSyncLog syncScheduled() {
        return sync(SCHEDULED_JOB_NAME);
    }

    private LotteryRecordSyncLog sync(String jobName) {
        Record before = recordService.findLast();
        String startIssue = before == null ? null : before.getCode();
        if (!acquireLock()) {
            return syncLogService.skipped(jobName, startIssue, "开奖记录同步任务正在执行，请稍后重试");
        }
        LotteryRecordSyncLog syncLog = syncLogService.start(jobName, startIssue);
        try {
            recordUpdate.update();
            Record after = recordService.findLast();
            int savedCount = savedCount(before, after);
            if (savedCount > 0) {
                statisticsService.invalidateCache();
            }
            int attachedPredictionCount = attachLatestActualPredictions();
            return syncLogService.success(syncLog, after == null ? null : after.getCode(), savedCount,
                    successMessage(savedCount, attachedPredictionCount));
        } catch (RuntimeException exception) {
            syncLogService.failure(syncLog, exception);
            throw exception;
        } finally {
            releaseLock();
        }
    }

    private int attachLatestActualPredictions() {
        try {
            List<LotteryPredictionSnapshot> updated = trainingService.attachLatestActualToMatchingPredictions();
            return updated == null ? 0 : updated.size();
        } catch (RuntimeException exception) {
            log.warn("开奖记录同步后回填预测结果失败", exception);
            return -1;
        }
    }

    private String successMessage(int savedCount, int attachedPredictionCount) {
        String message = savedCount > 0 ? "新增 " + savedCount + " 期开奖记录" : "没有新的开奖记录";
        if (attachedPredictionCount > 0) {
            return message + "，回填 " + attachedPredictionCount + " 条预测结果";
        }
        if (attachedPredictionCount < 0) {
            return message + "，预测回填失败，需手动重试";
        }
        return message;
    }

    private boolean acquireLock() {
        try {
            Boolean locked = redisTemplate.opsForValue().setIfAbsent(SYNC_LOCK_KEY, String.valueOf(System.currentTimeMillis()), SYNC_LOCK_TTL);
            return Boolean.TRUE.equals(locked);
        } catch (RuntimeException exception) {
            throw new ServiceException("开奖记录同步锁获取失败: " + exception.getMessage());
        }
    }

    private void releaseLock() {
        try {
            redisTemplate.delete(SYNC_LOCK_KEY);
        } catch (RuntimeException ignored) {
            // Lock will expire by TTL if Redis delete fails.
        }
    }

    private static int savedCount(Record before, Record after) {
        if (after == null) {
            return 0;
        }
        if (before == null) {
            return 1;
        }
        return Math.max(0, (int) (after.getLine() - before.getLine()));
    }
}
