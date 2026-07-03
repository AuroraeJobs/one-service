package com.one.record.service.impl;

import com.one.common.exception.ServiceException;
import com.one.record.configuration.StockMarketProperties;
import com.one.record.service.StockMarketProvider;
import com.one.record.stock.StockQuote;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.Charset;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class SinaStockMarketProvider implements StockMarketProvider {

    private static final Pattern SINA_QUOTE_PATTERN = Pattern.compile("var hq_str_([^=]+)=\\\"([^\\\"]*)\\\";");

    private final StockMarketProperties properties;

    private final RestTemplate restTemplate;

    public SinaStockMarketProvider(StockMarketProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(properties.getConnectTimeoutSeconds()));
        requestFactory.setReadTimeout(Duration.ofSeconds(properties.getReadTimeoutSeconds()));
        this.restTemplate = new RestTemplate(requestFactory);
    }

    @Override
    public String name() {
        return "sina";
    }

    @Override
    public List<StockQuote> quotes(List<String> symbols) {
        String quoteText = fetchSinaQuotes(symbols);
        return parseSinaQuotes(quoteText, symbols);
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

    private List<StockQuote> parseSinaQuotes(String quoteText, List<String> requestedSymbols) {
        Long fetchedAt = System.currentTimeMillis();
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

    private StockQuote parseSinaQuote(String sourceSymbol, String payload, Long fetchedAt) {
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
                .source(name())
                .sourceSymbol(sourceSymbol)
                .fetchedAt(fetchedAt)
                .available(true)
                .stale(false)
                .message("OK")
                .build();
    }

    private StockQuote unavailableQuote(String sourceSymbol, Long fetchedAt, String message) {
        String market = sourceSymbol.length() > 2 ? sourceSymbol.substring(0, 2) : "";
        String code = sourceSymbol.length() > 2 ? sourceSymbol.substring(2) : sourceSymbol;
        return StockQuote.builder()
                .symbol(sourceSymbol)
                .market(market)
                .code(code)
                .source(name())
                .sourceSymbol(sourceSymbol)
                .fetchedAt(fetchedAt)
                .available(false)
                .stale(false)
                .message(message)
                .build();
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
