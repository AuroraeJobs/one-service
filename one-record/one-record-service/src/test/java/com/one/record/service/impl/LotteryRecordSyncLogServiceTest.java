package com.one.record.service.impl;

import com.one.record.lottery.LotteryRecordSyncSummary;
import com.one.record.client.RecordClientException;
import com.one.record.model.LotteryRecordSyncLog;
import com.one.record.repository.LotteryRecordSyncLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

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
    void failureCapturesRecordClientDiagnostics() {
        LotteryRecordSyncLogRepository repository = mock(LotteryRecordSyncLogRepository.class);
        when(repository.save(any(LotteryRecordSyncLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        LotteryRecordSyncLogService service = new LotteryRecordSyncLogService(repository);
        LotteryRecordSyncLog running = LotteryRecordSyncLog.builder().status("RUNNING").startedAt(100L).build();
        RecordClientException exception = new RecordClientException(
                "彩票开奖接口请求失败，HTTP 403",
                "PROXY_OR_NETWORK_BLOCK",
                "cwl",
                "system",
                403,
                "text/html",
                "forbidden",
                true
        );

        LotteryRecordSyncLog failed = service.failure(running, exception);

        assertThat(failed.getStatus()).isEqualTo("FAILED");
        assertThat(failed.getFailureCategory()).isEqualTo("PROXY_OR_NETWORK_BLOCK");
        assertThat(failed.getProvider()).isEqualTo("cwl");
        assertThat(failed.getRequestMode()).isEqualTo("system");
        assertThat(failed.getHttpStatus()).isEqualTo(403);
        assertThat(failed.getNetworkBlockSuspected()).isTrue();
        assertThat(failed.getSavedCount()).isZero();
    }

    @Test
    void summaryIncludesLatestDiagnostics() {
        LotteryRecordSyncLogRepository repository = mock(LotteryRecordSyncLogRepository.class);
        when(repository.findByOrderByStartedAtDesc(any(Pageable.class))).thenReturn(List.of(
                LotteryRecordSyncLog.builder()
                        .jobName("manual-record-sync")
                        .status("FAILED")
                        .savedCount(0)
                        .message("彩票开奖接口请求失败，HTTP 403")
                        .failureCategory("PROXY_OR_NETWORK_BLOCK")
                        .provider("cwl")
                        .requestMode("system")
                        .httpStatus(403)
                        .networkBlockSuspected(true)
                        .startedAt(100L)
                        .finishedAt(120L)
                        .build()
        ));
        LotteryRecordSyncLogService service = new LotteryRecordSyncLogService(repository);

        LotteryRecordSyncSummary summary = service.summary(20);

        assertThat(summary.getLatestFailureCategory()).isEqualTo("PROXY_OR_NETWORK_BLOCK");
        assertThat(summary.getLatestProvider()).isEqualTo("cwl");
        assertThat(summary.getLatestRequestMode()).isEqualTo("system");
        assertThat(summary.getLatestHttpStatus()).isEqualTo(403);
        assertThat(summary.getLatestNetworkBlockSuspected()).isTrue();
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

    @Test
    void findPageFiltersByStatusAndStartedRange() {
        LotteryRecordSyncLogRepository repository = mock(LotteryRecordSyncLogRepository.class);
        when(repository.findAll(any(Sort.class))).thenReturn(List.of(
                log("manual-record-sync", "SUCCESS", 3, 100L, 120L),
                log("scheduled-record-sync", "FAILED", 0, 200L, 220L),
                log("scheduled-record-sync", "SUCCESS", 1, 300L, 320L)
        ));
        LotteryRecordSyncLogService service = new LotteryRecordSyncLogService(repository);

        var page = service.findPage("success", 150L, 350L, 0, 1);

        assertThat(page.getItems()).extracting(LotteryRecordSyncLog::getStartedAt).containsExactly(300L);
        assertThat(page.getPage()).isZero();
        assertThat(page.getPageSize()).isEqualTo(1);
        assertThat(page.getTotal()).isEqualTo(1);
        assertThat(page.getHasNext()).isFalse();
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
