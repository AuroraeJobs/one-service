package com.one.record.service.impl;

import com.one.common.exception.NotFoundException;
import com.one.record.exception.LotteryRecordSyncLogConflictException;
import com.one.record.lottery.LotteryRecordSyncSummary;
import com.one.record.client.RecordClientException;
import com.one.record.model.LotteryRecordSyncLog;
import com.one.record.repository.LotteryRecordSyncLogRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
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
    void findPageDelegatesFiltersAndZeroBasedPageToMongoRepository() {
        LotteryRecordSyncLogRepository repository = mock(LotteryRecordSyncLogRepository.class);
        when(repository.findPage(eq("SUCCESS"), eq(150L), eq(350L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(
                        List.of(log("scheduled-record-sync", "SUCCESS", 1, 300L, 320L)),
                        PageRequest.of(1, 1),
                        3
                ));
        LotteryRecordSyncLogService service = new LotteryRecordSyncLogService(repository);

        var page = service.findPage(" success ", 150L, 350L, 1, 1);

        assertThat(page.getItems()).extracting(LotteryRecordSyncLog::getStartedAt).containsExactly(300L);
        assertThat(page.getPage()).isEqualTo(1);
        assertThat(page.getPageSize()).isEqualTo(1);
        assertThat(page.getTotal()).isEqualTo(3);
        assertThat(page.getHasNext()).isTrue();

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.captor();
        verify(repository).findPage(eq("SUCCESS"), eq(150L), eq(350L), pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageNumber()).isEqualTo(1);
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(1);
        assertThat(pageableCaptor.getValue().getSort().getOrderFor("startedAt"))
                .extracting(Sort.Order::getDirection)
                .isEqualTo(Sort.Direction.DESC);
        assertThat(pageableCaptor.getValue().getSort().getOrderFor("_id"))
                .extracting(Sort.Order::getDirection)
                .isEqualTo(Sort.Direction.DESC);
        verify(repository, never()).findAll(any(Sort.class));
    }

    @Test
    void deleteRemovesExistingSyncLog() {
        LotteryRecordSyncLogRepository repository = mock(LotteryRecordSyncLogRepository.class);
        when(repository.findById("sync-1")).thenReturn(Optional.of(
                LotteryRecordSyncLog.builder().id("sync-1").status("SUCCESS").build()
        ));
        LotteryRecordSyncLogService service = new LotteryRecordSyncLogService(repository);

        service.delete("sync-1");

        verify(repository).deleteById("sync-1");
    }

    @Test
    void deleteRequiresExistingSyncLog() {
        LotteryRecordSyncLogRepository repository = mock(LotteryRecordSyncLogRepository.class);
        when(repository.findById("missing")).thenReturn(Optional.empty());
        LotteryRecordSyncLogService service = new LotteryRecordSyncLogService(repository);

        assertThatThrownBy(() -> service.delete("missing"))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("彩票同步记录不存在");
    }

    @Test
    void deleteRejectsRunningSyncLog() {
        LotteryRecordSyncLogRepository repository = mock(LotteryRecordSyncLogRepository.class);
        when(repository.findById("sync-running")).thenReturn(Optional.of(
                LotteryRecordSyncLog.builder().id("sync-running").status(" running ").build()
        ));
        LotteryRecordSyncLogService service = new LotteryRecordSyncLogService(repository);

        assertThatThrownBy(() -> service.delete("sync-running"))
                .isInstanceOf(LotteryRecordSyncLogConflictException.class)
                .hasMessageContaining("运行中")
                .hasMessageContaining("sync-running");
        verify(repository, never()).deleteById(anyString());
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
