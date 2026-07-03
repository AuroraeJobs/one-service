package com.one.record.service.impl;

import com.one.common.exception.ServiceException;
import com.one.record.configuration.StockMarketProperties;
import com.one.record.service.StockKLineProvider;
import com.one.record.stock.StockKLine;
import com.one.record.stock.StockProviderHealth;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
public class StockKLineProviderRouter {

    private final StockMarketProperties properties;

    private final Map<String, StockKLineProvider> providers;

    public StockKLineProviderRouter(StockMarketProperties properties, List<StockKLineProvider> providers) {
        this.properties = properties;
        this.providers = providers.stream()
                .collect(Collectors.toMap(provider -> normalizeProviderName(provider.name()), Function.identity(), (left, right) -> left, LinkedHashMap::new));
    }

    public List<StockKLine> dailyKLines(String symbol, String startDate, String endDate) {
        RuntimeException lastException = null;
        for (String providerName : providerChain()) {
            StockKLineProvider provider = providers.get(providerName);
            if (provider == null) {
                lastException = new ServiceException("股票K线 provider 未注册: {}", providerName);
                continue;
            }
            try {
                return provider.dailyKLines(symbol, startDate, endDate);
            } catch (RuntimeException ex) {
                lastException = ex;
                log.warn("Stock K-line provider failed, provider={}", providerName, ex);
            }
        }
        if (lastException != null) {
            throw lastException;
        }
        throw new ServiceException("未配置可用股票K线 provider");
    }

    public List<StockProviderHealth> health() {
        Set<String> configuredProviders = new LinkedHashSet<>(providerChain());
        configuredProviders.addAll(providers.keySet());
        Long checkedAt = System.currentTimeMillis();
        return configuredProviders.stream()
                .map(providerName -> StockProviderHealth.builder()
                        .category("kline")
                        .provider(providerName)
                        .active(providerName.equals(activeProviderName()))
                        .fallback(fallbackProviderNames().contains(providerName))
                        .registered(providers.containsKey(providerName))
                        .status(providers.containsKey(providerName) ? "REGISTERED" : "MISSING")
                        .checkedAt(checkedAt)
                        .build())
                .toList();
    }

    private List<String> providerChain() {
        List<String> chain = new ArrayList<>();
        chain.add(activeProviderName());
        chain.addAll(fallbackProviderNames());
        return chain.stream()
                .map(this::normalizeProviderName)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }

    private String activeProviderName() {
        return normalizeProviderName(StringUtils.hasText(properties.getProvider()) ? properties.getProvider() : properties.getSource());
    }

    private List<String> fallbackProviderNames() {
        if (properties.getFallbackProviders() == null) {
            return List.of();
        }
        return properties.getFallbackProviders().stream()
                .map(this::normalizeProviderName)
                .filter(StringUtils::hasText)
                .toList();
    }

    private String normalizeProviderName(String providerName) {
        return providerName == null ? "" : providerName.trim().toLowerCase(Locale.ROOT);
    }
}
