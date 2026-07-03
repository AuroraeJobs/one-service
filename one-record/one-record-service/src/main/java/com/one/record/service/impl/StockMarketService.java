package com.one.record.service.impl;

import com.one.common.exception.ServiceException;
import com.one.common.util.JsonUtil;
import com.one.record.configuration.StockMarketProperties;
import com.one.record.service.IStockMarketService;
import com.one.record.stock.StockProviderHealth;
import com.one.record.stock.StockProviderProbeResult;
import com.one.record.stock.StockQuote;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
public class StockMarketService implements IStockMarketService {

    private final StockMarketProperties properties;

    private final StringRedisTemplate redisTemplate;

    private final StockMarketProviderRouter providerRouter;

    private final StockKLineProviderRouter kLineProviderRouter;

    public StockMarketService(StockMarketProperties properties,
                              StringRedisTemplate redisTemplate,
                              StockMarketProviderRouter providerRouter,
                              StockKLineProviderRouter kLineProviderRouter) {
        this.properties = properties;
        this.redisTemplate = redisTemplate;
        this.providerRouter = providerRouter;
        this.kLineProviderRouter = kLineProviderRouter;
    }

    @Override
    public StockQuote quote(String symbol) {
        List<StockQuote> quotes = quotes(List.of(symbol));
        if (quotes.isEmpty()) {
            throw new ServiceException("未获取到股票行情: " + symbol);
        }
        return quotes.get(0);
    }

    @Override
    public List<StockQuote> quotes(List<String> symbols) {
        List<String> sourceSymbols = normalizeSymbols(symbols);
        if (sourceSymbols.isEmpty()) {
            return List.of();
        }

        List<StockQuote> result = new ArrayList<>();
        List<String> missingSymbols = new ArrayList<>();
        for (String sourceSymbol : sourceSymbols) {
            StockQuote cachedQuote = readCachedQuote(sourceSymbol, quoteKey(sourceSymbol));
            if (cachedQuote != null) {
                result.add(cachedQuote);
            } else {
                missingSymbols.add(sourceSymbol);
            }
        }

        if (!missingSymbols.isEmpty()) {
            try {
                List<StockQuote> fetchedQuotes = fetchProviderQuotes(missingSymbols);
                result.addAll(applyFallbackForUnavailableQuotes(fetchedQuotes));
                cacheSuccessfulQuotes(fetchedQuotes);
            } catch (RuntimeException ex) {
                log.warn("Failed to fetch stock quotes, trying fallback cache: {}", missingSymbols, ex);
                result.addAll(fallbackQuotes(missingSymbols, ex.getMessage()));
            }
        }
        return orderQuotes(result, sourceSymbols);
    }

    private List<String> normalizeSymbols(List<String> symbols) {
        List<String> inputSymbols = CollectionUtils.isEmpty(symbols) ? properties.getDefaultSymbols() : symbols;
        Set<String> sourceSymbols = new LinkedHashSet<>();
        for (String symbol : inputSymbols) {
            if (symbol == null || symbol.isBlank()) {
                continue;
            }
            String normalized = normalizeSymbol(symbol);
            if (!normalized.isBlank()) {
                sourceSymbols.add(normalized);
            }
        }
        return new ArrayList<>(sourceSymbols);
    }

    @Override
    public String normalizeSymbol(String symbol) {
        if (symbol == null) {
            return "";
        }
        String value = symbol.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
        if (value.startsWith("sh") || value.startsWith("sz")) {
            return value;
        }
        if (value.matches("\\d{6}")) {
            return (value.startsWith("6") || value.startsWith("9") ? "sh" : "sz") + value;
        }
        return value;
    }

    private List<StockQuote> fetchProviderQuotes(List<String> sourceSymbols) {
        return providerRouter.quotes(sourceSymbols);
    }

    private StockQuote unavailableQuote(String sourceSymbol, Long fetchedAt, String message) {
        String market = sourceSymbol.length() > 2 ? sourceSymbol.substring(0, 2) : "";
        String code = sourceSymbol.length() > 2 ? sourceSymbol.substring(2) : sourceSymbol;
        return StockQuote.builder()
                .symbol(sourceSymbol)
                .market(market)
                .code(code)
                .source(properties.getProvider())
                .sourceSymbol(sourceSymbol)
                .fetchedAt(fetchedAt)
                .available(false)
                .stale(false)
                .message(message)
                .build();
    }

    private void cacheSuccessfulQuotes(List<StockQuote> quotes) {
        if (!isCacheEnabled()) {
            return;
        }
        for (StockQuote quote : quotes) {
            if (!Boolean.TRUE.equals(quote.getAvailable())) {
                continue;
            }
            writeCache(quoteKey(quote.getSymbol()), quote, properties.getQuoteCacheTtlSeconds());
            writeCache(lastSuccessQuoteKey(quote.getSymbol()), quote, properties.getFallbackCacheTtlSeconds());
        }
    }

    private List<StockQuote> fallbackQuotes(List<String> sourceSymbols, String reason) {
        Long fallbackAt = System.currentTimeMillis();
        List<StockQuote> quotes = new ArrayList<>();
        for (String sourceSymbol : sourceSymbols) {
            StockQuote fallbackQuote = readCachedQuote(sourceSymbol, lastSuccessQuoteKey(sourceSymbol));
            if (fallbackQuote != null) {
                fallbackQuote.setStale(true);
                fallbackQuote.setStaleReason("第三方行情接口异常，返回最近一次成功缓存: " + reason);
                fallbackQuote.setMessage(fallbackQuote.getStaleReason());
                quotes.add(fallbackQuote);
            } else {
                quotes.add(unavailableQuote(sourceSymbol, fallbackAt, "第三方行情接口异常且无可用缓存: " + reason));
            }
        }
        return quotes;
    }

    private List<StockQuote> applyFallbackForUnavailableQuotes(List<StockQuote> quotes) {
        List<StockQuote> resolvedQuotes = new ArrayList<>();
        for (StockQuote quote : quotes) {
            if (Boolean.TRUE.equals(quote.getAvailable())) {
                resolvedQuotes.add(quote);
                continue;
            }

            StockQuote fallbackQuote = readCachedQuote(quote.getSymbol(), lastSuccessQuoteKey(quote.getSymbol()));
            if (fallbackQuote != null) {
                fallbackQuote.setStale(true);
                fallbackQuote.setStaleReason("第三方行情未返回有效数据，返回最近一次成功缓存: " + quote.getMessage());
                fallbackQuote.setMessage(fallbackQuote.getStaleReason());
                resolvedQuotes.add(fallbackQuote);
            } else {
                resolvedQuotes.add(quote);
            }
        }
        return resolvedQuotes;
    }

    private StockQuote readCachedQuote(String sourceSymbol, String key) {
        if (!isCacheEnabled()) {
            return null;
        }
        try {
            String value = redisTemplate.opsForValue().get(key);
            if (value == null || value.isBlank()) {
                return null;
            }
            StockQuote quote = JsonUtil.toObject(value, StockQuote.class);
            if (quote.getSymbol() == null || quote.getSymbol().isBlank()) {
                quote.setSymbol(sourceSymbol);
            }
            return quote;
        } catch (Exception ex) {
            log.warn("Failed to read stock quote cache, key={}", key, ex);
            return null;
        }
    }

    private void writeCache(String key, StockQuote quote, Integer ttlSeconds) {
        try {
            String value = JsonUtil.toJson(quote);
            if (ttlSeconds == null || ttlSeconds <= 0) {
                redisTemplate.opsForValue().set(key, value);
            } else {
                redisTemplate.opsForValue().set(key, value, Duration.ofSeconds(ttlSeconds));
            }
        } catch (RuntimeException ex) {
            log.warn("Failed to write stock quote cache, key={}", key, ex);
        }
    }

    private List<StockQuote> orderQuotes(List<StockQuote> quotes, List<String> sourceSymbols) {
        Map<String, StockQuote> quoteMap = new LinkedHashMap<>();
        for (StockQuote quote : quotes) {
            quoteMap.put(quote.getSymbol(), quote);
        }

        List<StockQuote> orderedQuotes = new ArrayList<>();
        for (String sourceSymbol : sourceSymbols) {
            StockQuote quote = quoteMap.get(sourceSymbol);
            if (quote != null) {
                orderedQuotes.add(quote);
            }
        }
        return orderedQuotes;
    }

    private boolean isCacheEnabled() {
        return Boolean.TRUE.equals(properties.getCacheEnabled());
    }

    @Override
    public List<StockProviderHealth> providerHealth() {
        List<StockProviderHealth> health = new ArrayList<>();
        health.addAll(providerRouter.health());
        health.addAll(kLineProviderRouter.health());
        return health;
    }

    @Override
    public StockProviderProbeResult providerProbe(String category, String symbol) {
        String probeCategory = normalizeProbeCategory(category);
        String probeSymbol = probeSymbol(probeCategory, symbol);
        Long startedAt = System.currentTimeMillis();
        StockProviderProbeResult result;
        try {
            int sampleCount;
            boolean available;
            if ("kline".equals(probeCategory)) {
                sampleCount = kLineProviderRouter.dailyKLines(probeSymbol, null, null).size();
                available = sampleCount > 0;
            } else {
                List<StockQuote> quotes = providerRouter.quotes(List.of(probeSymbol));
                sampleCount = quotes.size();
                available = quotes.stream().anyMatch(quote -> Boolean.TRUE.equals(quote.getAvailable()));
            }
            result = probeResult(probeCategory, probeSymbol, true, available, sampleCount, startedAt,
                    available ? "Provider 探测成功" : "Provider 已响应但未返回可用样本");
        } catch (RuntimeException ex) {
            log.warn("Stock provider probe failed, category={}, symbol={}", probeCategory, probeSymbol, ex);
            result = probeResult(probeCategory, probeSymbol, false, false, 0, startedAt, ex.getMessage());
        }
        writeProviderProbeCache(result);
        return result;
    }

    @Override
    public StockProviderProbeResult latestProviderProbe(String category) {
        String probeCategory = normalizeProbeCategory(category);
        try {
            String value = redisTemplate.opsForValue().get(providerProbeKey(probeCategory));
            if (value == null || value.isBlank()) {
                return null;
            }
            return JsonUtil.toObject(value, StockProviderProbeResult.class);
        } catch (RuntimeException ex) {
            log.warn("Failed to read stock provider probe cache, category={}", probeCategory, ex);
            return null;
        }
    }

    @Override
    public List<StockProviderProbeResult> providerProbeAll(String symbol) {
        return List.of(
                providerProbe("quote", symbol),
                providerProbe("kline", symbol)
        );
    }

    private StockProviderProbeResult probeResult(String category,
                                                 String symbol,
                                                 boolean success,
                                                 boolean available,
                                                 int sampleCount,
                                                 Long startedAt,
                                                 String message) {
        Long checkedAt = System.currentTimeMillis();
        return StockProviderProbeResult.builder()
                .category(category)
                .symbol(symbol)
                .success(success)
                .available(available)
                .sampleCount(sampleCount)
                .durationMs(checkedAt - startedAt)
                .checkedAt(checkedAt)
                .message(message)
                .build();
    }

    private String normalizeProbeCategory(String category) {
        if (category == null || category.isBlank()) {
            return "quote";
        }
        String value = category.trim().toLowerCase(Locale.ROOT);
        return "kline".equals(value) ? "kline" : "quote";
    }

    private String probeSymbol(String category, String symbol) {
        if (symbol != null && !symbol.isBlank()) {
            return normalizeSymbol(symbol);
        }
        List<String> configuredSymbols = "kline".equals(category) ? properties.getKlineSyncSymbols() : properties.getDefaultSymbols();
        if (CollectionUtils.isEmpty(configuredSymbols)) {
            return "sh000001";
        }
        return normalizeSymbol(configuredSymbols.get(0));
    }

    private void writeProviderProbeCache(StockProviderProbeResult result) {
        try {
            Integer ttlSeconds = properties.getProviderProbeTtlSeconds();
            String value = JsonUtil.toJson(result);
            String key = providerProbeKey(result.getCategory());
            if (ttlSeconds == null || ttlSeconds <= 0) {
                redisTemplate.opsForValue().set(key, value);
            } else {
                redisTemplate.opsForValue().set(key, value, Duration.ofSeconds(ttlSeconds));
            }
        } catch (RuntimeException ex) {
            log.warn("Failed to write stock provider probe cache, category={}", result.getCategory(), ex);
        }
    }

    private String quoteKey(String symbol) {
        return "stock:quote:" + symbol;
    }

    private String lastSuccessQuoteKey(String symbol) {
        return "stock:quote:last-success:" + symbol;
    }

    private String providerProbeKey(String category) {
        return "stock:provider:probe:last:" + category;
    }

}
