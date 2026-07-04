package com.one.record.service.impl;

import com.one.record.lottery.LotteryMaintenanceSummary;
import com.one.record.model.LotteryProviderProbeLog;
import com.one.record.model.LotteryRecordSyncLog;
import com.one.record.repository.LotteryBacktestReportRepository;
import com.one.record.repository.LotteryPredictionSnapshotRepository;
import com.one.record.repository.LotteryProviderProbeLogRepository;
import com.one.record.repository.LotteryRecordSyncLogRepository;
import com.one.record.repository.LotteryStrategyExperimentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LotteryMaintenanceServiceTest {

    private LotteryRecordSyncLogRepository syncLogRepository;

    private LotteryProviderProbeLogRepository probeLogRepository;

    private StringRedisTemplate redisTemplate;

    private LotteryMaintenanceService service;

    @BeforeEach
    void setUp() {
        syncLogRepository = mock(LotteryRecordSyncLogRepository.class);
        probeLogRepository = mock(LotteryProviderProbeLogRepository.class);
        LotteryPredictionSnapshotRepository predictionRepository = mock(LotteryPredictionSnapshotRepository.class);
        LotteryStrategyExperimentRepository experimentRepository = mock(LotteryStrategyExperimentRepository.class);
        LotteryBacktestReportRepository backtestRepository = mock(LotteryBacktestReportRepository.class);
        redisTemplate = mock(StringRedisTemplate.class);
        when(syncLogRepository.count()).thenReturn(2L);
        when(probeLogRepository.count()).thenReturn(1L);
        when(predictionRepository.count()).thenReturn(1200L);
        when(experimentRepository.count()).thenReturn(3L);
        when(backtestRepository.count()).thenReturn(4L);
        when(syncLogRepository.findAll()).thenReturn(List.of(
                LotteryRecordSyncLog.builder().finishedAt(1L).build(),
                LotteryRecordSyncLog.builder().finishedAt(System.currentTimeMillis()).build()
        ));
        when(probeLogRepository.findAll()).thenReturn(List.of(LotteryProviderProbeLog.builder().checkedAt(1L).build()));
        when(redisTemplate.hasKey(LotteryStatisticsService.SUMMARY_CACHE_KEY)).thenReturn(true);
        when(redisTemplate.getExpire(LotteryStatisticsService.SUMMARY_CACHE_KEY, TimeUnit.SECONDS)).thenReturn(-1L);
        service = new LotteryMaintenanceService(
                syncLogRepository,
                probeLogRepository,
                predictionRepository,
                experimentRepository,
                backtestRepository,
                redisTemplate
        );
    }

    @Test
    void cleanupDryRunReportsImpactWithoutDeleting() {
        LotteryMaintenanceSummary summary = service.cleanupDryRun();

        assertThat(summary.getDryRun()).isTrue();
        assertThat(summary.getCollections()).extracting("collection")
                .contains("lottery_record_sync_logs", "lottery_prediction_snapshots");
        assertThat(summary.getCollections()).anySatisfy(item -> {
            assertThat(item.getCollection()).isEqualTo("lottery_prediction_snapshots");
            assertThat(item.getOversizedBy()).isEqualTo(200L);
            assertThat(item.getCleanupSupported()).isFalse();
        });
        assertThat(summary.getCaches()).anySatisfy(item -> {
            assertThat(item.getCacheKey()).isEqualTo(LotteryStatisticsService.SUMMARY_CACHE_KEY);
            assertThat(item.getPresent()).isTrue();
            assertThat(item.getNoExpiry()).isTrue();
            assertThat(item.getCleanupSupported()).isFalse();
        });
    }
}
