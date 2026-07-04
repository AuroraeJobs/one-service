package com.one.record.service.impl;

import com.one.record.lottery.LotteryMaintenanceSummary;
import com.one.record.model.LotteryProviderProbeLog;
import com.one.record.model.LotteryRecordSyncLog;
import com.one.record.repository.LotteryBacktestReportRepository;
import com.one.record.repository.LotteryPredictionSnapshotRepository;
import com.one.record.repository.LotteryProviderProbeLogRepository;
import com.one.record.repository.LotteryRecordSyncLogRepository;
import com.one.record.repository.LotteryStrategyExperimentRepository;
import com.one.record.service.ILotteryMaintenanceService;
import lombok.AllArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@AllArgsConstructor
public class LotteryMaintenanceService implements ILotteryMaintenanceService {

    private static final int LOG_RETENTION_DAYS = 90;

    private static final int HISTORY_LIMIT = 1000;

    private static final List<String> CACHE_KEYS = List.of(
            LotteryStatisticsService.SUMMARY_CACHE_KEY,
            "lottery:training:last",
            "lottery:prediction:latest",
            "lottery:training:timeline",
            "lottery:actual:latest",
            "lottery:records:sync:lock"
    );

    private final LotteryRecordSyncLogRepository syncLogRepository;

    private final LotteryProviderProbeLogRepository probeLogRepository;

    private final LotteryPredictionSnapshotRepository predictionSnapshotRepository;

    private final LotteryStrategyExperimentRepository experimentRepository;

    private final LotteryBacktestReportRepository backtestReportRepository;

    private final StringRedisTemplate redisTemplate;

    @Override
    public LotteryMaintenanceSummary summary() {
        return build(true);
    }

    @Override
    public LotteryMaintenanceSummary cleanupDryRun() {
        return build(true);
    }

    private LotteryMaintenanceSummary build(boolean dryRun) {
        long now = System.currentTimeMillis();
        long cutoff = now - LOG_RETENTION_DAYS * 24L * 60L * 60L * 1000L;
        long syncTotal = syncLogRepository.count();
        long probeTotal = probeLogRepository.count();
        long predictionTotal = predictionSnapshotRepository.count();
        long experimentTotal = experimentRepository.count();
        long backtestTotal = backtestReportRepository.count();
        return LotteryMaintenanceSummary.builder()
                .dryRun(dryRun)
                .collections(List.of(
                        status("lottery_record_sync_logs", syncTotal, staleSyncLogs(cutoff), LOG_RETENTION_DAYS, Math.max(0, syncTotal - HISTORY_LIMIT), true),
                        status("lottery_provider_probe_logs", probeTotal, staleProbeLogs(cutoff), LOG_RETENTION_DAYS, Math.max(0, probeTotal - HISTORY_LIMIT), true),
                        status("lottery_prediction_snapshots", predictionTotal, 0, null, Math.max(0, predictionTotal - HISTORY_LIMIT), false),
                        status("lottery_strategy_experiments", experimentTotal, 0, null, Math.max(0, experimentTotal - HISTORY_LIMIT), false),
                        status("lottery_backtest_reports", backtestTotal, 0, null, Math.max(0, backtestTotal - HISTORY_LIMIT), false)
                ))
                .caches(cacheStatuses())
                .generatedAt(now)
                .build();
    }

    private LotteryMaintenanceSummary.CollectionStatus status(String collection,
                                                              long total,
                                                              long stale,
                                                              Integer retentionDays,
                                                              long oversizedBy,
                                                              boolean cleanupSupported) {
        return LotteryMaintenanceSummary.CollectionStatus.builder()
                .collection(collection)
                .totalCount(total)
                .staleCount(stale)
                .retentionDays(retentionDays)
                .oversizedBy(oversizedBy)
                .cleanupSupported(cleanupSupported)
                .message(cleanupSupported ? "仅支持 dry-run 预览" : "当前仅报告容量，不执行清理")
                .build();
    }

    private List<LotteryMaintenanceSummary.CacheStatus> cacheStatuses() {
        return CACHE_KEYS.stream()
                .map(this::cacheStatus)
                .toList();
    }

    private LotteryMaintenanceSummary.CacheStatus cacheStatus(String key) {
        try {
            Boolean present = redisTemplate.hasKey(key);
            Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
            boolean exists = Boolean.TRUE.equals(present);
            boolean noExpiry = exists && ttl != null && ttl == -1L;
            return LotteryMaintenanceSummary.CacheStatus.builder()
                    .cacheKey(key)
                    .present(exists)
                    .ttlSeconds(exists ? ttl : null)
                    .noExpiry(noExpiry)
                    .cleanupSupported(false)
                    .message(cacheMessage(exists, ttl))
                    .build();
        } catch (RuntimeException exception) {
            return LotteryMaintenanceSummary.CacheStatus.builder()
                    .cacheKey(key)
                    .present(false)
                    .cleanupSupported(false)
                    .message("缓存状态读取失败: " + exception.getMessage())
                    .build();
        }
    }

    private String cacheMessage(boolean present, Long ttl) {
        if (!present) {
            return "缓存不存在";
        }
        if (ttl == null) {
            return "缓存存在，TTL 未知";
        }
        if (ttl == -1L) {
            return "缓存存在且未设置过期时间，仅报告";
        }
        if (ttl == -2L) {
            return "缓存不存在";
        }
        return "缓存存在，剩余 TTL " + ttl + " 秒";
    }

    private long staleSyncLogs(long cutoff) {
        return syncLogRepository.findAll().stream()
                .map(LotteryRecordSyncLog::getFinishedAt)
                .filter(value -> value != null && value < cutoff)
                .count();
    }

    private long staleProbeLogs(long cutoff) {
        return probeLogRepository.findAll().stream()
                .map(LotteryProviderProbeLog::getCheckedAt)
                .filter(value -> value != null && value < cutoff)
                .count();
    }
}
