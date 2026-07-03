package com.one.record.service.impl;

import com.one.common.exception.ServiceException;
import com.one.record.repository.StockAccountRepository;
import com.one.record.repository.StockPositionRepository;
import com.one.record.repository.StockTradeRepository;
import com.one.record.service.IStockMarketService;
import com.one.record.stock.StockAccount;
import com.one.record.stock.StockTrade;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StockPortfolioServiceTest {

    private StockAccountRepository accountRepository;

    private StockTradeRepository tradeRepository;

    private IStockMarketService stockMarketService;

    private StockPortfolioService service;

    @BeforeEach
    void setUp() {
        accountRepository = mock(StockAccountRepository.class);
        StockPositionRepository positionRepository = mock(StockPositionRepository.class);
        tradeRepository = mock(StockTradeRepository.class);
        stockMarketService = mock(IStockMarketService.class);
        service = new StockPortfolioService(accountRepository, positionRepository, tradeRepository, stockMarketService);
    }

    @Test
    void saveAccountFillsDefaultsAndTimestamps() {
        ArgumentCaptor<StockAccount> captor = ArgumentCaptor.forClass(StockAccount.class);
        when(accountRepository.save(captor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        StockAccount saved = service.saveAccount(StockAccount.builder()
                .name(" 长线账户 ")
                .broker(" 中信 ")
                .build());

        assertThat(saved.getUserId()).isEqualTo("default");
        assertThat(saved.getName()).isEqualTo("长线账户");
        assertThat(saved.getBroker()).isEqualTo("中信");
        assertThat(saved.getCurrency()).isEqualTo("CNY");
        assertThat(saved.getCashBalance()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(saved.getStatus()).isEqualTo("ACTIVE");
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void saveTradeNormalizesSymbolAndTradeType() {
        ArgumentCaptor<StockTrade> captor = ArgumentCaptor.forClass(StockTrade.class);
        when(stockMarketService.normalizeSymbol("600519")).thenReturn("sh600519");
        when(tradeRepository.save(captor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        StockTrade saved = service.saveTrade(StockTrade.builder()
                .symbol("600519")
                .tradeType("buy")
                .quantity(new BigDecimal("100"))
                .price(new BigDecimal("1700"))
                .build());

        assertThat(saved.getSymbol()).isEqualTo("sh600519");
        assertThat(saved.getMarket()).isEqualTo("sh");
        assertThat(saved.getCode()).isEqualTo("600519");
        assertThat(saved.getTradeType()).isEqualTo("BUY");
        assertThat(saved.getQuantity()).isEqualByComparingTo("100");
        assertThat(saved.getPrice()).isEqualByComparingTo("1700");
        assertThat(saved.getAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(saved.getFee()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(saved.getTax()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(saved.getTradedAt()).isNotNull();
    }

    @Test
    void saveTradeRejectsUnsupportedTradeType() {
        assertThatThrownBy(() -> service.saveTrade(StockTrade.builder()
                .symbol("600519")
                .tradeType("UNKNOWN")
                .build()))
                .isInstanceOf(ServiceException.class)
                .hasMessageContaining("不支持的股票交易类型");
    }
}
