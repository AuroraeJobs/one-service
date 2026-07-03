package com.one.record.service.impl;

import com.one.record.configuration.StockMarketProperties;
import com.one.record.service.IStockAlertService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@AllArgsConstructor
public class StockAlertScheduledEvaluation {

    private final StockMarketProperties properties;

    private final IStockAlertService stockAlertService;

    @Scheduled(cron = "${stock.market.alert-evaluation-cron:0 */5 9-15 * * MON-FRI}")
    public void evaluateAlerts() {
        if (!Boolean.TRUE.equals(properties.getAlertEvaluationEnabled())) {
            return;
        }
        try {
            stockAlertService.evaluate();
        } catch (RuntimeException ex) {
            log.warn("Stock alert scheduled evaluation failed: {}", ex.getMessage(), ex);
        }
    }
}
