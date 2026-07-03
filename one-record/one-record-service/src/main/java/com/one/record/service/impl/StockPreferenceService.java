package com.one.record.service.impl;

import com.one.common.exception.ServiceException;
import com.one.record.repository.StockPreferenceRepository;
import com.one.record.service.IStockPreferenceService;
import com.one.record.stock.StockPreference;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Set;

@Service
@AllArgsConstructor
public class StockPreferenceService implements IStockPreferenceService {

    private static final String DEFAULT_USER_ID = "default";
    private static final String DEFAULT_CURRENCY = "CNY";
    private static final String DEFAULT_KLINE_PERIOD = "daily";
    private static final int DEFAULT_REFRESH_INTERVAL_SECONDS = 30;
    private static final int MIN_REFRESH_INTERVAL_SECONDS = 5;
    private static final int MAX_REFRESH_INTERVAL_SECONDS = 3600;
    private static final Set<String> SUPPORTED_KLINE_PERIODS = Set.of("daily", "weekly", "monthly");

    private final StockPreferenceRepository repository;

    @Override
    public StockPreference get() {
        return repository.findByUserId(DEFAULT_USER_ID).orElseGet(this::defaultPreference);
    }

    @Override
    public StockPreference save(StockPreference preference) {
        StockPreference existing = repository.findByUserId(DEFAULT_USER_ID).orElse(null);
        Long now = System.currentTimeMillis();
        StockPreference next = StockPreference.builder()
                .id(existing == null ? null : existing.getId())
                .userId(DEFAULT_USER_ID)
                .defaultAccountId(trimToNull(preference == null ? null : preference.getDefaultAccountId()))
                .defaultCurrency(normalizeCurrency(preference == null ? null : preference.getDefaultCurrency()))
                .defaultKLinePeriod(normalizeKLinePeriod(preference == null ? null : preference.getDefaultKLinePeriod()))
                .quoteRefreshIntervalSeconds(normalizeRefreshInterval(preference == null ? null : preference.getQuoteRefreshIntervalSeconds()))
                .createdAt(existing == null ? now : existing.getCreatedAt())
                .updatedAt(now)
                .build();
        return repository.save(next);
    }

    private StockPreference defaultPreference() {
        Long now = System.currentTimeMillis();
        return StockPreference.builder()
                .userId(DEFAULT_USER_ID)
                .defaultCurrency(DEFAULT_CURRENCY)
                .defaultKLinePeriod(DEFAULT_KLINE_PERIOD)
                .quoteRefreshIntervalSeconds(DEFAULT_REFRESH_INTERVAL_SECONDS)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private String normalizeCurrency(String value) {
        String currency = trimToNull(value);
        if (currency == null) {
            return DEFAULT_CURRENCY;
        }
        return currency.toUpperCase(Locale.ROOT);
    }

    private String normalizeKLinePeriod(String value) {
        String period = trimToNull(value);
        if (period == null) {
            return DEFAULT_KLINE_PERIOD;
        }
        String normalized = period.toLowerCase(Locale.ROOT);
        if (!SUPPORTED_KLINE_PERIODS.contains(normalized)) {
            throw new ServiceException("不支持的默认K线周期: {}", period);
        }
        return normalized;
    }

    private Integer normalizeRefreshInterval(Integer value) {
        if (value == null) {
            return DEFAULT_REFRESH_INTERVAL_SECONDS;
        }
        if (value < MIN_REFRESH_INTERVAL_SECONDS || value > MAX_REFRESH_INTERVAL_SECONDS) {
            throw new ServiceException("行情刷新间隔必须在{}到{}秒之间", MIN_REFRESH_INTERVAL_SECONDS, MAX_REFRESH_INTERVAL_SECONDS);
        }
        return value;
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
