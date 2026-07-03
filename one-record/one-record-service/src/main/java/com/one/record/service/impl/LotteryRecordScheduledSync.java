package com.one.record.service.impl;

import com.one.record.configuration.RecordProperties;
import com.one.record.service.ILotteryRecordSyncService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@AllArgsConstructor
public class LotteryRecordScheduledSync {

    private final RecordProperties properties;

    private final ILotteryRecordSyncService syncService;

    @Scheduled(cron = "${hello.record.scheduled-sync-cron:0 30 22 * * SUN,TUE,THU}")
    public void syncRecords() {
        if (!properties.isScheduledSyncEnabled()) {
            return;
        }
        try {
            syncService.syncScheduled();
        } catch (RuntimeException exception) {
            log.warn("Lottery record scheduled sync failed: {}", exception.getMessage(), exception);
        }
    }
}
