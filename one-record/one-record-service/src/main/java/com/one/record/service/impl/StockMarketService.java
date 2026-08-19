package com.one.record.service.impl;

import com.one.common.exception.ServiceException;
import com.one.common.util.JsonUtil;
import com.one.record.configuration.StockMarketProperties;
import com.one.record.service.IStockMarketService;
import com.one.record.stock.StockProviderConfig;
import com.one.record.stock.StockProviderHealth;
import com.one.record.stock.StockProviderProbeResult;
import com.one.record.stock.StockQuote;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.StringRedisConnection;
import org.springframework.data.redis.core.RedisCallback;
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
import java.util.function.Function;

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

        Map<String, StockQuote> cachedQuotes = readCachedQuotes(sourceSymbols, this::quoteKey);
        List<StockQuote> result = new ArrayList<>();
        List<String> missingSymbols = new ArrayList<>();
        for (String sourceSymbol : sourceSymbols) {
            StockQuote cachedQuote = cachedQuotes.get(sourceSymbol);
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
        return StockQuote.builder()
                .symbol(sourceSymbol)
                .market(market(sourceSymbol))
                .code(code(sourceSymbol))
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
        List<StockQuote> successfulQuotes = quotes.stream()
                .filter(quote -> Boolean.TRUE.equals(quote.getAvailable()))
                .toList();
        if (successfulQuotes.isEmpty()) {
            return;
        }
        try {
            redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
                StringRedisConnection stringConnection = (StringRedisConnection) connection;
                for (StockQuote quote : successfulQuotes) {
                    String value = JsonUtil.toJson(quote);
                    setWithTtl(stringConnection, quoteKey(quote.getSymbol()), value, properties.getQuoteCacheTtlSeconds());
                    setWithTtl(stringConnection, lastSuccessQuoteKey(quote.getSymbol()), value, properties.getFallbackCacheTtlSeconds());
                }
                return null;
            });
        } catch (RuntimeException ex) {
            log.warn("Failed to write stock quote cache in pipeline", ex);
        }
    }

    private void setWithTtl(StringRedisConnection connection, String key, String value, Integer ttlSeconds) {
        if (ttlSeconds == null || ttlSeconds <= 0) {
            connection.set(key, value);
        } else {
            connection.setEx(key, ttlSeconds, value);
        }
    }

    private List<StockQuote> fallbackQuotes(List<String> sourceSymbols, String reason) {
        Long fallbackAt = System.currentTimeMillis();
        Map<String, StockQuote> fallbackMap = readCachedQuotes(sourceSymbols, this::lastSuccessQuoteKey);
        List<StockQuote> quotes = new ArrayList<>();
        for (String sourceSymbol : sourceSymbols) {
            StockQuote fallbackQuote = fallbackMap.get(sourceSymbol);
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
        List<String> unavailableSymbols = quotes.stream()
                .filter(quote -> !Boolean.TRUE.equals(quote.getAvailable()))
                .map(StockQuote::getSymbol)
                .toList();
        Map<String, StockQuote> fallbackMap = readCachedQuotes(unavailableSymbols, this::lastSuccessQuoteKey);
        List<StockQuote> resolvedQuotes = new ArrayList<>();
        for (StockQuote quote : quotes) {
            if (Boolean.TRUE.equals(quote.getAvailable())) {
                resolvedQuotes.add(quote);
                continue;
            }

            StockQuote fallbackQuote = fallbackMap.get(quote.getSymbol());
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

    private Map<String, StockQuote> readCachedQuotes(List<String> sourceSymbols, Function<String, String> keyFunction) {
        Map<String, StockQuote> cachedQuotes = new LinkedHashMap<>();
        if (!isCacheEnabled() || sourceSymbols.isEmpty()) {
            return cachedQuotes;
        }
        List<String> keys = sourceSymbols.stream().map(keyFunction).toList();
        List<String> values;
        try {
            values = redisTemplate.opsForValue().multiGet(keys);
        } catch (RuntimeException ex) {
            log.warn("Failed to batch read stock quote cache, keys={}", keys, ex);
            return cachedQuotes;
        }
        if (values == null) {
            return cachedQuotes;
        }
        for (int index = 0; index < sourceSymbols.size(); index++) {
            String value = values.get(index);
            if (value == null || value.isBlank()) {
                continue;
            }
            try {
                StockQuote quote = JsonUtil.toObject(value, StockQuote.class);
                if (quote.getSymbol() == null || quote.getSymbol().isBlank()) {
                    quote.setSymbol(sourceSymbols.get(index));
                }
                cachedQuotes.put(sourceSymbols.get(index), quote);
            } catch (Exception ex) {
                log.warn("Failed to parse stock quote cache, key={}", keys.get(index), ex);
            }
        }
        return cachedQuotes;
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
    public StockProviderConfig providerConfig() {
        return StockProviderConfig.builder()
                .provider(properties.getProvider())
                .fallbackProviders(properties.getFallbackProviders())
                .cacheEnabled(properties.getCacheEnabled())
                .quoteCacheTtlSeconds(properties.getQuoteCacheTtlSeconds())
                .fallbackCacheTtlSeconds(properties.getFallbackCacheTtlSeconds())
                .providerProbeTtlSeconds(properties.getProviderProbeTtlSeconds())
                .defaultSymbols(properties.getDefaultSymbols())
                .klineSyncEnabled(properties.getKlineSyncEnabled())
                .klineSyncCron(properties.getKlineSyncCron())
                .klineSyncSymbols(properties.getKlineSyncSymbols())
                .alertEvaluationEnabled(properties.getAlertEvaluationEnabled())
                .alertEvaluationCron(properties.getAlertEvaluationCron())
                .checkedAt(System.currentTimeMillis())
                .build();
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
