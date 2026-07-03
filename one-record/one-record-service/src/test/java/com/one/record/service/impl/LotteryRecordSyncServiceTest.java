package com.one.record.service.impl;

import com.one.record.model.LotteryRecordSyncLog;
import com.one.record.response.Record;
import com.one.record.service.ILotteryRecordSyncLogService;
import com.one.record.service.IRecordService;
import com.one.record.service.IRecordUpdate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryRecordSyncServiceTest {

    private IRecordService recordService;

    private IRecordUpdate recordUpdate;

    private ILotteryRecordSyncLogService syncLogService;

    private StringRedisTemplate redisTemplate;

    private ValueOperations<String, String> valueOperations;

    private LotteryRecordSyncService service;

    @BeforeEach
    void setUp() {
        recordService = mock(IRecordService.class);
        recordUpdate = mock(IRecordUpdate.class);
        syncLogService = mock(ILotteryRecordSyncLogService.class);
        redisTemplate = mock(StringRedisTemplate.class);
        valueOperations = mockValueOperations();
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), anyString(), any(Duration.class))).thenReturn(true);
        service = new LotteryRecordSyncService(recordService, recordUpdate, syncLogService, redisTemplate);
    }

    @SuppressWarnings("unchecked")
    private ValueOperations<String, String> mockValueOperations() {
        return (ValueOperations<String, String>) mock(ValueOperations.class);
    }

    @Test
    void syncManuallyWritesSuccessLogAndReleasesLock() {
        Record before = record("2026001", 1);
        Record after = record("2026003", 3);
        LotteryRecordSyncLog running = LotteryRecordSyncLog.builder().id("sync-1").status("RUNNING").build();
        LotteryRecordSyncLog success = LotteryRecordSyncLog.builder().id("sync-1").status("SUCCESS").savedCount(2).build();
        when(recordService.findLast()).thenReturn(before, after);
        when(syncLogService.start("manual-record-sync", "2026001")).thenReturn(running);
        when(syncLogService.success(running, "2026003", 2, "新增 2 期开奖记录")).thenReturn(success);

        LotteryRecordSyncLog result = service.syncManually();

        assertThat(result.getStatus()).isEqualTo("SUCCESS");
        verify(recordUpdate).update();
        verify(syncLogService).success(running, "2026003", 2, "新增 2 期开奖记录");
        verify(redisTemplate).delete("lottery:records:sync:lock");
    }

    @Test
    void syncManuallyReturnsSkippedLogWhenLockExists() {
        Record before = record("2026001", 1);
        LotteryRecordSyncLog skipped = LotteryRecordSyncLog.builder().status("SKIPPED").savedCount(0).build();
        when(recordService.findLast()).thenReturn(before);
        when(valueOperations.setIfAbsent(anyString(), anyString(), any(Duration.class))).thenReturn(false);
        when(syncLogService.skipped("manual-record-sync", "2026001", "开奖记录同步任务正在执行，请稍后重试")).thenReturn(skipped);

        LotteryRecordSyncLog result = service.syncManually();

        assertThat(result.getStatus()).isEqualTo("SKIPPED");
        verify(recordUpdate, never()).update();
        verify(redisTemplate, never()).delete(anyString());
    }

    @Test
    void syncManuallyWritesFailureLogAndReleasesLock() {
        Record before = record("2026001", 1);
        LotteryRecordSyncLog running = LotteryRecordSyncLog.builder().id("sync-1").status("RUNNING").build();
        when(recordService.findLast()).thenReturn(before);
        when(syncLogService.start("manual-record-sync", "2026001")).thenReturn(running);
        doThrow(new IllegalStateException("provider unavailable")).when(recordUpdate).update();

        assertThatThrownBy(() -> service.syncManually())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("provider unavailable");

        verify(syncLogService).failure(running, "provider unavailable");
        verify(redisTemplate).delete("lottery:records:sync:lock");
    }

    private static Record record(String code, long line) {
        Record record = new Record();
        record.setCode(code);
        record.setLine(line);
        return record;
    }
}
