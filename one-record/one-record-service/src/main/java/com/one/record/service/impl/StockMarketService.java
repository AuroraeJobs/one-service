package com.one.record.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.one.common.exception.ServiceException;
import com.one.record.configuration.StockMarketProperties;
import com.one.record.service.IStockMarketService;
import com.one.record.stock.StockQuote;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.Charset;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class StockMarketService implements IStockMarketService {

    private static final Pattern SINA_QUOTE_PATTERN = Pattern.compile("var hq_str_([^=]+)=\\\"([^\\\"]*)\\\";");

    private final StockMarketProperties properties;

    private final StringRedisTemplate redisTemplate;

    private final ObjectMapper objectMapper;

    private final RestTemplate restTemplate;

    public StockMarketService(StockMarketProperties properties,
                              StringRedisTemplate redisTemplate,
                              ObjectMapper objectMapper) {
        this.properties = properties;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper.copy().findAndRegisterModules();
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(properties.getConnectTimeoutSeconds()));
        requestFactory.setReadTimeout(Duration.ofSeconds(properties.getReadTimeoutSeconds()));
        this.restTemplate = new RestTemplate(requestFactory);
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

    private String fetchSinaQuotes(List<String> sourceSymbols) {
        String url = properties.getSinaQuoteUrl() + String.join(",", sourceSymbols);
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.REFERER, properties.getReferer());
        headers.set(HttpHeaders.USER_AGENT, properties.getUserAgent());

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), byte[].class);
            byte[] body = response.getBody();
            if (body == null || body.length == 0) {
                throw new ServiceException("第三方行情接口未返回数据");
            }
            return new String(body, Charset.forName(properties.getCharset()));
        } catch (RestClientException ex) {
            log.error("Failed to fetch stock quotes from Sina: {}", sourceSymbols, ex);
            throw new ServiceException("第三方行情接口调用失败: " + ex.getMessage());
        }
    }

    private List<StockQuote> fetchProviderQuotes(List<String> sourceSymbols) {
        String quoteText = fetchSinaQuotes(sourceSymbols);
        return parseSinaQuotes(quoteText, sourceSymbols);
    }

    private List<StockQuote> parseSinaQuotes(String quoteText, List<String> requestedSymbols) {
        LocalDateTime fetchedAt = LocalDateTime.now();
        List<StockQuote> quotes = new ArrayList<>();
        Matcher matcher = SINA_QUOTE_PATTERN.matcher(quoteText);
        while (matcher.find()) {
            quotes.add(parseSinaQuote(matcher.group(1), matcher.group(2), fetchedAt));
        }

        Set<String> returnedSymbols = new LinkedHashSet<>();
        for (StockQuote quote : quotes) {
            returnedSymbols.add(quote.getSourceSymbol());
        }
        for (String requestedSymbol : requestedSymbols) {
            if (!returnedSymbols.contains(requestedSymbol)) {
                quotes.add(unavailableQuote(requestedSymbol, fetchedAt, "第三方行情接口未返回该标的"));
            }
        }
        return quotes;
    }

    private StockQuote parseSinaQuote(String sourceSymbol, String payload, LocalDateTime fetchedAt) {
        String market = sourceSymbol.length() > 2 ? sourceSymbol.substring(0, 2) : "";
        String code = sourceSymbol.length() > 2 ? sourceSymbol.substring(2) : sourceSymbol;
        if (payload == null || payload.isBlank()) {
            return unavailableQuote(sourceSymbol, fetchedAt, "未查询到该股票代码");
        }

        String[] fields = payload.split(",", -1);
        if (fields.length < 32) {
            return unavailableQuote(sourceSymbol, fetchedAt, "第三方行情数据格式异常");
        }

        BigDecimal price = decimal(fields[3]);
        BigDecimal previousClose = decimal(fields[2]);
        BigDecimal changeAmount = price != null && previousClose != null ? price.subtract(previousClose) : null;
        BigDecimal changePercent = null;
        if (changeAmount != null && previousClose != null && previousClose.compareTo(BigDecimal.ZERO) != 0) {
            changePercent = changeAmount.multiply(BigDecimal.valueOf(100)).divide(previousClose, 2, RoundingMode.HALF_UP);
        }

        return StockQuote.builder()
                .symbol(sourceSymbol)
                .market(market)
                .code(code)
                .name(fields[0])
                .price(price)
                .changeAmount(changeAmount)
                .changePercent(changePercent)
                .open(decimal(fields[1]))
                .previousClose(previousClose)
                .high(decimal(fields[4]))
                .low(decimal(fields[5]))
                .volume(longValue(fields[8]))
                .amount(decimal(fields[9]))
                .tradeDateTime((fields[30] + " " + fields[31]).trim())
                .source(properties.getSource())
                .sourceSymbol(sourceSymbol)
                .fetchedAt(fetchedAt)
                .available(true)
                .stale(false)
                .message("OK")
                .build();
    }

    private StockQuote unavailableQuote(String sourceSymbol, LocalDateTime fetchedAt, String message) {
        String market = sourceSymbol.length() > 2 ? sourceSymbol.substring(0, 2) : "";
        String code = sourceSymbol.length() > 2 ? sourceSymbol.substring(2) : sourceSymbol;
        return StockQuote.builder()
                .symbol(sourceSymbol)
                .market(market)
                .code(code)
                .source(properties.getSource())
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
        LocalDateTime fallbackAt = LocalDateTime.now();
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
            StockQuote quote = objectMapper.readValue(value, StockQuote.class);
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
            String value = objectMapper.writeValueAsString(quote);
            if (ttlSeconds == null || ttlSeconds <= 0) {
                redisTemplate.opsForValue().set(key, value);
            } else {
                redisTemplate.opsForValue().set(key, value, Duration.ofSeconds(ttlSeconds));
            }
        } catch (JsonProcessingException ex) {
            log.warn("Failed to serialize stock quote cache, key={}", key, ex);
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

    private String quoteKey(String symbol) {
        return "stock:quote:" + symbol;
    }

    private String lastSuccessQuoteKey(String symbol) {
        return "stock:quote:last-success:" + symbol;
    }

    private BigDecimal decimal(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(value.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Long longValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
