package com.one.record.service.impl;

import com.one.common.exception.ServiceException;
import com.one.record.configuration.StockMarketProperties;
import com.one.record.service.StockKLineProvider;
import com.one.record.stock.StockKLine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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

    private List<String> providerChain() {
        List<String> chain = new ArrayList<>();
        chain.add(activeProviderName());
        if (properties.getFallbackProviders() != null) {
            chain.addAll(properties.getFallbackProviders());
        }
        return chain.stream()
                .map(this::normalizeProviderName)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }

    private String activeProviderName() {
        return normalizeProviderName(StringUtils.hasText(properties.getProvider()) ? properties.getProvider() : properties.getSource());
    }

    private String normalizeProviderName(String providerName) {
        return providerName == null ? "" : providerName.trim().toLowerCase(Locale.ROOT);
    }
}
