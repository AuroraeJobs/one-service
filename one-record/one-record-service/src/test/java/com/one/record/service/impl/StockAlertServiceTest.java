package com.one.record.service.impl;

import com.one.common.exception.ServiceException;
import com.one.record.repository.StockAlertHistoryRepository;
import com.one.record.repository.StockAlertRuleRepository;
import com.one.record.service.IStockMarketService;
import com.one.record.stock.StockAlertHistory;
import com.one.record.stock.StockAlertRule;
import com.one.record.stock.StockQuote;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StockAlertServiceTest {

    private StockAlertRuleRepository ruleRepository;

    private StockAlertHistoryRepository historyRepository;

    private IStockMarketService stockMarketService;

    private StringRedisTemplate redisTemplate;

    private ValueOperations<String, String> valueOperations;

    private StockAlertService service;

    @BeforeEach
    void setUp() {
        ruleRepository = mock(StockAlertRuleRepository.class);
        historyRepository = mock(StockAlertHistoryRepository.class);
        stockMarketService = mock(IStockMarketService.class);
        redisTemplate = mock(StringRedisTemplate.class);
        valueOperations = mockValueOperations();
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        service = new StockAlertService(ruleRepository, historyRepository, stockMarketService, redisTemplate);
    }

    @SuppressWarnings("unchecked")
    private ValueOperations<String, String> mockValueOperations() {
        return (ValueOperations<String, String>) mock(ValueOperations.class);
    }

    @Test
    void saveRuleNormalizesSymbolAndDefaults() {
        ArgumentCaptor<StockAlertRule> captor = ArgumentCaptor.forClass(StockAlertRule.class);
        when(stockMarketService.normalizeSymbol("600519")).thenReturn("sh600519");
        when(ruleRepository.save(captor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        StockAlertRule saved = service.saveRule(StockAlertRule.builder()
                .symbol("600519")
                .name(" 贵州茅台 ")
                .ruleType("price")
                .direction("above")
                .targetValue(new BigDecimal("1800"))
                .build());

        assertThat(saved.getUserId()).isEqualTo("default");
        assertThat(saved.getSymbol()).isEqualTo("sh600519");
        assertThat(saved.getMarket()).isEqualTo("sh");
        assertThat(saved.getCode()).isEqualTo("600519");
        assertThat(saved.getName()).isEqualTo("贵州茅台");
        assertThat(saved.getRuleType()).isEqualTo("PRICE");
        assertThat(saved.getDirection()).isEqualTo("ABOVE");
        assertThat(saved.getTargetValue()).isEqualByComparingTo("1800");
        assertThat(saved.getEnabled()).isTrue();
        assertThat(saved.getThrottleSeconds()).isEqualTo(3600);
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void saveRuleRejectsUnsupportedRuleType() {
        when(stockMarketService.normalizeSymbol("600519")).thenReturn("sh600519");

        assertThatThrownBy(() -> service.saveRule(StockAlertRule.builder()
                .symbol("600519")
                .ruleType("unknown")
                .direction("above")
                .targetValue(BigDecimal.ONE)
                .build()))
                .isInstanceOf(ServiceException.class)
                .hasMessageContaining("不支持的提醒类型");
    }

    @Test
    void historyNormalizesSymbolFilter() {
        when(stockMarketService.normalizeSymbol("600519")).thenReturn("sh600519");
        when(historyRepository.findTop100ByUserIdAndSymbolOrderByTriggeredAtDesc("default", "sh600519"))
                .thenReturn(List.of(StockAlertHistory.builder().symbol("sh600519").build()));

        List<StockAlertHistory> histories = service.history("600519");

        assertThat(histories).hasSize(1);
        verify(historyRepository).findTop100ByUserIdAndSymbolOrderByTriggeredAtDesc("default", "sh600519");
    }

    @Test
    void evaluateTriggersPricePercentAndVolumeRules() {
        when(ruleRepository.findByUserIdAndEnabledOrderByCreatedAtDesc("default", true)).thenReturn(List.of(
                alertRule("r1", "PRICE", "ABOVE", "1800"),
                alertRule("r2", "PERCENT_CHANGE", "UP", "3"),
                alertRule("r3", "VOLUME_ABNORMAL", "ABOVE", "1000")
        ));
        when(stockMarketService.quotes(List.of("sh600519"))).thenReturn(List.of(StockQuote.builder()
                .symbol("sh600519")
                .price(new BigDecimal("1810"))
                .changePercent(new BigDecimal("3.5"))
                .volume(2000L)
                .available(true)
                .build()));
        when(valueOperations.setIfAbsent(anyString(), anyString(), any(Duration.class))).thenReturn(true);
        when(historyRepository.save(any(StockAlertHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(ruleRepository.save(any(StockAlertRule.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<StockAlertHistory> histories = service.evaluate();

        assertThat(histories).hasSize(3);
        assertThat(histories).extracting(StockAlertHistory::getRuleType)
                .containsExactly("PRICE", "PERCENT_CHANGE", "VOLUME_ABNORMAL");
        assertThat(histories).extracting(StockAlertHistory::getTriggerValue)
                .containsExactly(new BigDecimal("1810"), new BigDecimal("3.5"), new BigDecimal("2000"));
        verify(ruleRepository, times(3)).save(any(StockAlertRule.class));
        verify(valueOperations, times(3)).setIfAbsent(anyString(), anyString(), any(Duration.class));
        verify(valueOperations).set(anyString(), anyString());
    }

    @Test
    void evaluateSkipsThrottledRule() {
        when(ruleRepository.findByUserIdAndEnabledOrderByCreatedAtDesc("default", true)).thenReturn(List.of(
                alertRule("r1", "PRICE", "ABOVE", "1800")
        ));
        when(stockMarketService.quotes(List.of("sh600519"))).thenReturn(List.of(StockQuote.builder()
                .symbol("sh600519")
                .price(new BigDecimal("1810"))
                .available(true)
                .build()));
        when(valueOperations.setIfAbsent(anyString(), anyString(), any(Duration.class))).thenReturn(false);

        List<StockAlertHistory> histories = service.evaluate();

        assertThat(histories).isEmpty();
        verify(valueOperations).set(anyString(), anyString());
    }

    private StockAlertRule alertRule(String id, String ruleType, String direction, String targetValue) {
        return StockAlertRule.builder()
                .id(id)
                .userId("default")
                .symbol("sh600519")
                .ruleType(ruleType)
                .direction(direction)
                .targetValue(new BigDecimal(targetValue))
                .enabled(true)
                .throttleSeconds(60)
                .build();
    }
}
