package com.one.record.service.impl;

import com.one.record.lottery.LotteryRecordSyncSummary;
import com.one.record.model.LotteryRecordSyncLog;
import com.one.record.repository.LotteryRecordSyncLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryRecordSyncLogServiceTest {

    @Test
    void summaryAggregatesRecentSyncLogs() {
        LotteryRecordSyncLogRepository repository = mock(LotteryRecordSyncLogRepository.class);
        when(repository.findByOrderByStartedAtDesc(any(Pageable.class))).thenReturn(List.of(
                log("manual-record-sync", "SUCCESS", 3, 1_000L, 1_200L),
                log("scheduled-record-sync", "FAILED", 0, 800L, 900L),
                log("scheduled-record-sync", "SKIPPED", 0, 700L, 700L)
        ));
        LotteryRecordSyncLogService service = new LotteryRecordSyncLogService(repository);

        LotteryRecordSyncSummary summary = service.summary(20);

        assertThat(summary.getTotalCount()).isEqualTo(3);
        assertThat(summary.getSuccessCount()).isEqualTo(1);
        assertThat(summary.getFailedCount()).isEqualTo(1);
        assertThat(summary.getSkippedCount()).isEqualTo(1);
        assertThat(summary.getSuccessRate()).isEqualByComparingTo(new BigDecimal("33.33"));
        assertThat(summary.getFailedRate()).isEqualByComparingTo(new BigDecimal("33.33"));
        assertThat(summary.getSavedCount()).isEqualTo(3);
        assertThat(summary.getLatestStatus()).isEqualTo("SUCCESS");
        assertThat(summary.getLatestDurationMs()).isEqualTo(200L);
        assertThat(summary.getAverageDurationMs()).isEqualTo(100L);
        assertThat(summary.getLastSuccessAt()).isEqualTo(1_200L);
        assertThat(summary.getLastFailureAt()).isEqualTo(900L);
        assertThat(summary.getLastSkippedAt()).isEqualTo(700L);
        verify(repository).findByOrderByStartedAtDesc(any(Pageable.class));
    }

    @Test
    void summaryReturnsZeroValuesWhenThereAreNoLogs() {
        LotteryRecordSyncLogRepository repository = mock(LotteryRecordSyncLogRepository.class);
        when(repository.findByOrderByStartedAtDesc(any(Pageable.class))).thenReturn(List.of());
        LotteryRecordSyncLogService service = new LotteryRecordSyncLogService(repository);

        LotteryRecordSyncSummary summary = service.summary(0);

        assertThat(summary.getTotalCount()).isZero();
        assertThat(summary.getSuccessRate()).isEqualByComparingTo(new BigDecimal("0.00"));
        assertThat(summary.getLatestStatus()).isNull();
        assertThat(summary.getAverageDurationMs()).isNull();
    }

    private static LotteryRecordSyncLog log(String jobName, String status, Integer savedCount, Long startedAt, Long finishedAt) {
        return LotteryRecordSyncLog.builder()
                .jobName(jobName)
                .status(status)
                .startIssue("2026001")
                .endIssue("2026002")
                .savedCount(savedCount)
                .message(status)
                .startedAt(startedAt)
                .finishedAt(finishedAt)
                .build();
    }
}
