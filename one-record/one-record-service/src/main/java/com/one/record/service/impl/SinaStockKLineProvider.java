package com.one.record.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.one.common.exception.ServiceException;
import com.one.common.util.JsonUtil;
import com.one.record.configuration.StockMarketProperties;
import com.one.record.service.StockKLineProvider;
import com.one.record.stock.StockKLine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.nio.charset.Charset;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class SinaStockKLineProvider implements StockKLineProvider {

    private static final String DAILY_PERIOD = "daily";

    private final StockMarketProperties properties;

    private final RestTemplate restTemplate;

    public SinaStockKLineProvider(StockMarketProperties properties) {
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
    public List<StockKLine> dailyKLines(String symbol, String startDate, String endDate) {
        String kLineText = fetchSinaKLines(symbol);
        return parseSinaKLines(symbol, kLineText, startDate, endDate);
    }

    private String fetchSinaKLines(String symbol) {
        String url = UriComponentsBuilder.fromUriString(properties.getSinaKlineUrl())
                .queryParam("symbol", symbol)
                .queryParam("scale", 240)
                .queryParam("ma", "no")
                .queryParam("datalen", 1023)
                .toUriString();
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.REFERER, properties.getReferer());
        headers.set(HttpHeaders.USER_AGENT, properties.getUserAgent());

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), byte[].class);
            byte[] body = response.getBody();
            if (body == null || body.length == 0) {
                throw new ServiceException("第三方K线接口未返回数据");
            }
            return new String(body, Charset.forName(properties.getCharset()));
        } catch (RestClientException ex) {
            log.error("Failed to fetch stock K-lines from Sina: {}", symbol, ex);
            throw new ServiceException("第三方K线接口调用失败: " + ex.getMessage());
        }
    }

    private List<StockKLine> parseSinaKLines(String symbol, String kLineText, String startDate, String endDate) {
        JsonNode root = JsonUtil.toJsonNode(kLineText);
        if (!root.isArray()) {
            throw new ServiceException("第三方K线数据格式异常");
        }
        List<StockKLine> kLines = new ArrayList<>();
        for (JsonNode node : root) {
            String tradeDate = text(node, "day");
            if (!withinDateRange(tradeDate, startDate, endDate)) {
                continue;
            }
            BigDecimal open = decimal(node, "open");
            BigDecimal close = decimal(node, "close");
            BigDecimal previousClose = kLines.isEmpty() ? null : kLines.get(kLines.size() - 1).getClose();
            BigDecimal changeAmount = close != null && previousClose != null ? close.subtract(previousClose) : null;
            BigDecimal changePercent = changeAmount != null && previousClose != null && previousClose.compareTo(BigDecimal.ZERO) != 0
                    ? changeAmount.multiply(BigDecimal.valueOf(100)).divide(previousClose, 2, java.math.RoundingMode.HALF_UP)
                    : null;
            kLines.add(StockKLine.builder()
                    .symbol(symbol)
                    .market(market(symbol))
                    .code(code(symbol))
                    .period(DAILY_PERIOD)
                    .tradeDate(tradeDate)
                    .open(open)
                    .close(close)
                    .high(decimal(node, "high"))
                    .low(decimal(node, "low"))
                    .volume(longValue(node, "volume"))
                    .amount(decimal(node, "amount"))
                    .changeAmount(changeAmount)
                    .changePercent(changePercent)
                    .source(name())
                    .build());
        }
        return kLines;
    }

    private boolean withinDateRange(String tradeDate, String startDate, String endDate) {
        if (tradeDate == null || tradeDate.isBlank()) {
            return false;
        }
        if (startDate != null && !startDate.isBlank() && tradeDate.compareTo(startDate.trim()) < 0) {
            return false;
        }
        return endDate == null || endDate.isBlank() || tradeDate.compareTo(endDate.trim()) <= 0;
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    private BigDecimal decimal(JsonNode node, String field) {
        String value = text(node, field);
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(value.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Long longValue(JsonNode node, String field) {
        String value = text(node, field);
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String market(String symbol) {
        return symbol.length() > 2 ? symbol.substring(0, 2) : "";
    }

    private String code(String symbol) {
        return symbol.length() > 2 ? symbol.substring(2) : symbol;
    }
}
