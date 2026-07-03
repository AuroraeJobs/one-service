package com.one.record.service.impl;

import com.one.record.configuration.StockMarketProperties;
import com.one.record.repository.StockKLineRepository;
import com.one.record.repository.StockKLineSyncLogRepository;
import com.one.record.service.IStockMarketService;
import com.one.record.service.StockKLineProvider;
import com.one.record.stock.StockKLine;
import com.one.record.stock.StockKLineSyncLog;
import com.one.record.stock.StockKLineSyncSummary;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.nio.charset.Charset;
import java.time.Duration;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class StockKLineServiceTest {

    private StockKLineRepository repository;

    private StockKLineSyncLogRepository syncLogRepository;

    private IStockMarketService stockMarketService;

    private StringRedisTemplate redisTemplate;

    private ValueOperations<String, String> valueOperations;

    private StockMarketProperties properties;

    @BeforeEach
    void setUp() {
        repository = mock(StockKLineRepository.class);
        syncLogRepository = mock(StockKLineSyncLogRepository.class);
        stockMarketService = mock(IStockMarketService.class);
        redisTemplate = mock(StringRedisTemplate.class);
        valueOperations = mockValueOperations();
        properties = new StockMarketProperties();
        properties.setKlineSyncSymbols(List.of("sh600519"));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), anyString(), any(Duration.class))).thenReturn(true);
        when(syncLogRepository.save(any(StockKLineSyncLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(repository.findBySymbolAndPeriodAndTradeDate(anyString(), anyString(), anyString())).thenReturn(Optional.empty());
        when(repository.save(any(StockKLine.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(stockMarketService.normalizeSymbol("600519")).thenReturn("sh600519");
        when(stockMarketService.normalizeSymbol("sh600519")).thenReturn("sh600519");
    }

    @SuppressWarnings("unchecked")
    private ValueOperations<String, String> mockValueOperations() {
        return (ValueOperations<String, String>) mock(ValueOperations.class);
    }

    @Test
    void sinaProviderParsesDailyKLines() {
        SinaStockKLineProvider provider = new SinaStockKLineProvider(properties);
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(provider, "restTemplate");
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        server.expect(requestTo("https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=sh600519&scale=240&ma=no&datalen=1023"))
                .andRespond(withSuccess("""
                        [
                          {"day":"2026-07-02","open":"10.00","high":"10.50","low":"9.80","close":"10.20","volume":"1000","amount":"10200"},
                          {"day":"2026-07-03","open":"10.20","high":"11.00","low":"10.10","close":"10.80","volume":"1200","amount":"12960"}
                        ]
                        """.getBytes(Charset.forName("GBK")), MediaType.APPLICATION_JSON));

        List<StockKLine> kLines = provider.dailyKLines("sh600519", "2026-07-03", "2026-07-03");

        assertThat(kLines).hasSize(1);
        StockKLine kLine = kLines.get(0);
        assertThat(kLine.getSymbol()).isEqualTo("sh600519");
        assertThat(kLine.getPeriod()).isEqualTo("daily");
        assertThat(kLine.getTradeDate()).isEqualTo("2026-07-03");
        assertThat(kLine.getOpen()).isEqualByComparingTo(new BigDecimal("10.20"));
        assertThat(kLine.getClose()).isEqualByComparingTo(new BigDecimal("10.80"));
        assertThat(kLine.getVolume()).isEqualTo(1200L);
        assertThat(kLine.getSource()).isEqualTo("sina");
        server.verify();
    }

    @Test
    void syncFetchesProviderDataWhenRequestRowsAreEmpty() {
        StockKLineProvider provider = new StubKLineProvider();
        StockKLineProviderRouter router = new StockKLineProviderRouter(properties, List.of(provider));
        StockKLineService service = new StockKLineService(repository, syncLogRepository, stockMarketService, redisTemplate, properties, router);

        List<StockKLine> saved = service.sync("600519", List.of());

        assertThat(saved).hasSize(1);
        assertThat(saved.get(0).getSymbol()).isEqualTo("sh600519");
        assertThat(saved.get(0).getTradeDate()).isEqualTo("2026-07-03");
        ArgumentCaptor<StockKLineSyncLog> captor = ArgumentCaptor.forClass(StockKLineSyncLog.class);
        org.mockito.Mockito.verify(syncLogRepository, org.mockito.Mockito.atLeastOnce()).save(captor.capture());
        StockKLineSyncLog lastLog = captor.getAllValues().get(captor.getAllValues().size() - 1);
        assertThat(lastLog.getStatus()).isEqualTo("SUCCESS");
        assertThat(lastLog.getSavedCount()).isEqualTo(1);
    }

    @Test
    void scheduledDailySyncFetchesConfiguredSymbolsFromProvider() {
        StockKLineProvider provider = new StubKLineProvider();
        StockKLineProviderRouter router = new StockKLineProviderRouter(properties, List.of(provider));
        StockKLineService service = new StockKLineService(repository, syncLogRepository, stockMarketService, redisTemplate, properties, router);

        StockKLineSyncLog log = service.scheduledDailySync();

        assertThat(log.getStatus()).isEqualTo("SUCCESS");
        assertThat(log.getRequestedCount()).isEqualTo(1);
        assertThat(log.getSavedCount()).isEqualTo(1);
        assertThat(log.getMessage()).isEqualTo("OK");
    }

    @Test
    void retryConfiguredSyncFetchesConfiguredSymbolsFromProvider() {
        StockKLineProvider provider = new StubKLineProvider();
        StockKLineProviderRouter router = new StockKLineProviderRouter(properties, List.of(provider));
        StockKLineService service = new StockKLineService(repository, syncLogRepository, stockMarketService, redisTemplate, properties, router);

        List<StockKLine> saved = service.retryConfiguredSync();

        assertThat(saved).hasSize(1);
        ArgumentCaptor<StockKLineSyncLog> captor = ArgumentCaptor.forClass(StockKLineSyncLog.class);
        org.mockito.Mockito.verify(syncLogRepository, org.mockito.Mockito.atLeastOnce()).save(captor.capture());
        StockKLineSyncLog lastLog = captor.getAllValues().get(captor.getAllValues().size() - 1);
        assertThat(lastLog.getJobName()).isEqualTo("stock-kline-sync-retry-all");
        assertThat(lastLog.getStatus()).isEqualTo("SUCCESS");
        assertThat(lastLog.getSavedCount()).isEqualTo(1);
    }

    @Test
    void syncSummaryAggregatesRecentLogs() {
        when(syncLogRepository.findTop50ByOrderByStartedAtDesc()).thenReturn(List.of(
                StockKLineSyncLog.builder()
                        .jobName("stock-kline-sync-all")
                        .status("FAILED")
                        .requestedCount(3)
                        .savedCount(0)
                        .message("provider down")
                        .startedAt(3000L)
                        .finishedAt(3500L)
                        .build(),
                StockKLineSyncLog.builder()
                        .jobName("stock-kline-sync")
                        .symbol("sh600519")
                        .status("SUCCESS")
                        .requestedCount(1)
                        .savedCount(2)
                        .message("OK")
                        .startedAt(2000L)
                        .finishedAt(2500L)
                        .build(),
                StockKLineSyncLog.builder()
                        .jobName("stock-kline-sync")
                        .symbol("sh600519")
                        .status("RUNNING")
                        .requestedCount(1)
                        .savedCount(0)
                        .startedAt(1000L)
                        .build()
        ));
        StockKLineProviderRouter router = new StockKLineProviderRouter(properties, List.of(new StubKLineProvider()));
        StockKLineService service = new StockKLineService(repository, syncLogRepository, stockMarketService, redisTemplate, properties, router);

        StockKLineSyncSummary summary = service.syncSummary(null);

        assertThat(summary.getTotalCount()).isEqualTo(3);
        assertThat(summary.getSuccessCount()).isEqualTo(1);
        assertThat(summary.getFailedCount()).isEqualTo(1);
        assertThat(summary.getRunningCount()).isEqualTo(1);
        assertThat(summary.getRequestedCount()).isEqualTo(5);
        assertThat(summary.getSavedCount()).isEqualTo(2);
        assertThat(summary.getLatestJobName()).isEqualTo("stock-kline-sync-all");
        assertThat(summary.getLatestStatus()).isEqualTo("FAILED");
        assertThat(summary.getLatestMessage()).isEqualTo("provider down");
        assertThat(summary.getLatestStartedAt()).isEqualTo(3000L);
        assertThat(summary.getLatestFinishedAt()).isEqualTo(3500L);
        assertThat(summary.getLastSuccessAt()).isEqualTo(2500L);
        assertThat(summary.getLastFailureAt()).isEqualTo(3500L);
        assertThat(summary.getGeneratedAt()).isNotNull();
    }

    @Test
    void syncSummaryNormalizesSymbolFilter() {
        when(stockMarketService.normalizeSymbol("600519")).thenReturn("sh600519");
        when(syncLogRepository.findTop50BySymbolOrderByStartedAtDesc("sh600519")).thenReturn(List.of());
        StockKLineProviderRouter router = new StockKLineProviderRouter(properties, List.of(new StubKLineProvider()));
        StockKLineService service = new StockKLineService(repository, syncLogRepository, stockMarketService, redisTemplate, properties, router);

        StockKLineSyncSummary summary = service.syncSummary("600519");

        assertThat(summary.getSymbol()).isEqualTo("sh600519");
        assertThat(summary.getTotalCount()).isZero();
    }

    private static class StubKLineProvider implements StockKLineProvider {

        @Override
        public String name() {
            return "sina";
        }

        @Override
        public List<StockKLine> dailyKLines(String symbol, String startDate, String endDate) {
            return List.of(StockKLine.builder()
                    .symbol(symbol)
                    .period("daily")
                    .tradeDate("2026-07-03")
                    .open(new BigDecimal("10"))
                    .close(new BigDecimal("11"))
                    .source(name())
                    .build());
        }
    }
}
