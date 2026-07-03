package com.one.record.service.impl;

import com.one.common.exception.ServiceException;
import com.one.record.repository.StockAlertHistoryRepository;
import com.one.record.repository.StockAlertRuleRepository;
import com.one.record.service.IStockMarketService;
import com.one.record.stock.StockAlertHistory;
import com.one.record.stock.StockAlertRule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StockAlertServiceTest {

    private StockAlertRuleRepository ruleRepository;

    private StockAlertHistoryRepository historyRepository;

    private IStockMarketService stockMarketService;

    private StockAlertService service;

    @BeforeEach
    void setUp() {
        ruleRepository = mock(StockAlertRuleRepository.class);
        historyRepository = mock(StockAlertHistoryRepository.class);
        stockMarketService = mock(IStockMarketService.class);
        service = new StockAlertService(ruleRepository, historyRepository, stockMarketService);
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
}
