package com.one.record.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.one.record.configuration.StockMarketProperties;
import com.one.record.stock.StockQuote;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.nio.charset.Charset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class StockMarketServiceTest {

    private StockMarketProperties properties;

    private StringRedisTemplate redisTemplate;

    private ValueOperations<String, String> valueOperations;

    private ObjectMapper objectMapper;

    private StockMarketService service;

    @BeforeEach
    void setUp() {
        properties = new StockMarketProperties();
        properties.setCacheEnabled(false);
        redisTemplate = mock(StringRedisTemplate.class);
        valueOperations = mockValueOperations();
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        objectMapper = new ObjectMapper();
        service = new StockMarketService(properties, redisTemplate, objectMapper);
    }

    @SuppressWarnings("unchecked")
    private ValueOperations<String, String> mockValueOperations() {
        return (ValueOperations<String, String>) mock(ValueOperations.class);
    }

    @Test
    void normalizeSymbolAddsMarketPrefixForAShares() {
        assertThat(service.normalizeSymbol("600519")).isEqualTo("sh600519");
        assertThat(service.normalizeSymbol("900901")).isEqualTo("sh900901");
        assertThat(service.normalizeSymbol("000001")).isEqualTo("sz000001");
        assertThat(service.normalizeSymbol("300750")).isEqualTo("sz300750");
        assertThat(service.normalizeSymbol(" SH600519 ")).isEqualTo("sh600519");
        assertThat(service.normalizeSymbol(null)).isEmpty();
    }

    @Test
    void quotesParsesSinaResponseIntoNormalizedQuote() {
        MockRestServiceServer server = bindMockServer();
        server.expect(requestTo("https://hq.sinajs.cn/list=sh600519"))
                .andRespond(withSuccess(sinaResponse("sh600519", sinaPayload("贵州茅台")).getBytes(Charset.forName("GBK")), MediaType.TEXT_PLAIN));

        List<StockQuote> quotes = service.quotes(List.of("600519"));

        assertThat(quotes).hasSize(1);
        StockQuote quote = quotes.get(0);
        assertThat(quote.getSymbol()).isEqualTo("sh600519");
        assertThat(quote.getMarket()).isEqualTo("sh");
        assertThat(quote.getCode()).isEqualTo("600519");
        assertThat(quote.getName()).isEqualTo("贵州茅台");
        assertThat(quote.getPrice()).isEqualByComparingTo(new BigDecimal("1710.00"));
        assertThat(quote.getPreviousClose()).isEqualByComparingTo(new BigDecimal("1690.00"));
        assertThat(quote.getChangeAmount()).isEqualByComparingTo(new BigDecimal("20.00"));
        assertThat(quote.getChangePercent()).isEqualByComparingTo(new BigDecimal("1.18"));
        assertThat(quote.getVolume()).isEqualTo(123456L);
        assertThat(quote.getAmount()).isEqualByComparingTo(new BigDecimal("210000000.00"));
        assertThat(quote.getTradeDateTime()).isEqualTo("2026-07-03 15:00:00");
        assertThat(quote.getAvailable()).isTrue();
        assertThat(quote.getStale()).isFalse();
        server.verify();
    }

    @Test
    void quotesReturnsLastSuccessCacheWhenProviderFails() throws Exception {
        properties.setCacheEnabled(true);
        properties.setQuoteCacheTtlSeconds(10);
        properties.setFallbackCacheTtlSeconds(604800);

        StockQuote cachedQuote = StockQuote.builder()
                .symbol("sh600519")
                .market("sh")
                .code("600519")
                .name("贵州茅台")
                .price(new BigDecimal("1710.00"))
                .available(true)
                .stale(false)
                .message("OK")
                .build();
        when(valueOperations.get("stock:quote:sh600519")).thenReturn(null);
        when(valueOperations.get("stock:quote:last-success:sh600519")).thenReturn(objectMapper.writeValueAsString(cachedQuote));

        MockRestServiceServer server = bindMockServer();
        server.expect(requestTo("https://hq.sinajs.cn/list=sh600519")).andRespond(withServerError());

        List<StockQuote> quotes = service.quotes(List.of("600519"));

        assertThat(quotes).hasSize(1);
        StockQuote quote = quotes.get(0);
        assertThat(quote.getSymbol()).isEqualTo("sh600519");
        assertThat(quote.getName()).isEqualTo("贵州茅台");
        assertThat(quote.getAvailable()).isTrue();
        assertThat(quote.getStale()).isTrue();
        assertThat(quote.getStaleReason()).contains("返回最近一次成功缓存");
        server.verify();
    }

    private MockRestServiceServer bindMockServer() {
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        return MockRestServiceServer.bindTo(restTemplate).build();
    }

    private String sinaResponse(String symbol, String payload) {
        return "var hq_str_" + symbol + "=\"" + payload + "\";";
    }

    private String sinaPayload(String name) {
        String[] fields = new String[32];
        for (int i = 0; i < fields.length; i++) {
            fields[i] = "0";
        }
        fields[0] = name;
        fields[1] = "1700.00";
        fields[2] = "1690.00";
        fields[3] = "1710.00";
        fields[4] = "1720.00";
        fields[5] = "1688.00";
        fields[8] = "123456";
        fields[9] = "210000000.00";
        fields[30] = "2026-07-03";
        fields[31] = "15:00:00";
        return String.join(",", fields);
    }
}
