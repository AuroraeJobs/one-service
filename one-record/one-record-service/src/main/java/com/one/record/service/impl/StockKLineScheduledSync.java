package com.one.record.service.impl;

import com.one.record.configuration.StockMarketProperties;
import com.one.record.service.IStockKLineService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@AllArgsConstructor
public class StockKLineScheduledSync {

    private final StockMarketProperties properties;

    private final IStockKLineService stockKLineService;

    @Scheduled(cron = "${stock.market.kline-sync-cron:0 30 15 * * MON-FRI}")
    public void syncDailyKLines() {
        if (!Boolean.TRUE.equals(properties.getKlineSyncEnabled())) {
            return;
        }
        try {
            stockKLineService.scheduledDailySync();
        } catch (RuntimeException ex) {
            log.warn("Stock K-line scheduled sync failed: {}", ex.getMessage(), ex);
        }
    }
}
