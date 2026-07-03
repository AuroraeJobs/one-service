package com.one.record.service.impl;

import com.one.record.configuration.RecordProperties;
import com.one.record.service.ILotteryRecordSyncService;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class LotteryRecordScheduledSyncTest {

    @Test
    void syncRecordsSkipsWhenDisabled() {
        RecordProperties properties = new RecordProperties();
        ILotteryRecordSyncService syncService = mock(ILotteryRecordSyncService.class);
        LotteryRecordScheduledSync scheduledSync = new LotteryRecordScheduledSync(properties, syncService);

        scheduledSync.syncRecords();

        verify(syncService, never()).syncScheduled();
    }

    @Test
    void syncRecordsRunsWhenEnabled() {
        RecordProperties properties = new RecordProperties();
        properties.setScheduledSyncEnabled(true);
        ILotteryRecordSyncService syncService = mock(ILotteryRecordSyncService.class);
        LotteryRecordScheduledSync scheduledSync = new LotteryRecordScheduledSync(properties, syncService);

        scheduledSync.syncRecords();

        verify(syncService).syncScheduled();
    }

    @Test
    void syncRecordsSwallowsRuntimeFailure() {
        RecordProperties properties = new RecordProperties();
        properties.setScheduledSyncEnabled(true);
        ILotteryRecordSyncService syncService = mock(ILotteryRecordSyncService.class);
        doThrow(new IllegalStateException("provider unavailable")).when(syncService).syncScheduled();
        LotteryRecordScheduledSync scheduledSync = new LotteryRecordScheduledSync(properties, syncService);

        scheduledSync.syncRecords();

        verify(syncService).syncScheduled();
    }
}
