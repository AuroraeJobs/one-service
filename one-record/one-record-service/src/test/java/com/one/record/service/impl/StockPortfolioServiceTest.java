package com.one.record.service.impl;

import com.one.common.exception.ServiceException;
import com.one.record.repository.StockAccountRepository;
import com.one.record.repository.StockPositionRepository;
import com.one.record.repository.StockTradeRepository;
import com.one.record.service.IStockMarketService;
import com.one.record.stock.StockAccount;
import com.one.record.stock.StockPortfolioSummary;
import com.one.record.stock.StockPosition;
import com.one.record.stock.StockQuote;
import com.one.record.stock.StockTrade;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StockPortfolioServiceTest {

    private StockAccountRepository accountRepository;

    private StockPositionRepository positionRepository;

    private StockTradeRepository tradeRepository;

    private IStockMarketService stockMarketService;

    private StockPortfolioService service;

    @BeforeEach
    void setUp() {
        accountRepository = mock(StockAccountRepository.class);
        positionRepository = mock(StockPositionRepository.class);
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

    @Test
    void summaryCalculatesMarketValueAndPnl() {
        when(positionRepository.findByUserIdOrderBySymbolAscCreatedAtAsc("default")).thenReturn(List.of(
                StockPosition.builder()
                        .id("p1")
                        .symbol("sh600519")
                        .market("sh")
                        .code("600519")
                        .name("贵州茅台")
                        .quantity(new BigDecimal("100"))
                        .costPrice(new BigDecimal("1500"))
                        .costAmount(new BigDecimal("150000"))
                        .build(),
                StockPosition.builder()
                        .id("p2")
                        .symbol("sz000001")
                        .market("sz")
                        .code("000001")
                        .name("平安银行")
                        .quantity(new BigDecimal("1000"))
                        .costPrice(new BigDecimal("10"))
                        .costAmount(new BigDecimal("10000"))
                        .build()
        ));
        when(stockMarketService.quotes(List.of("sh600519", "sz000001"))).thenReturn(List.of(
                StockQuote.builder()
                        .symbol("sh600519")
                        .name("贵州茅台")
                        .price(new BigDecimal("1700"))
                        .changeAmount(new BigDecimal("20"))
                        .changePercent(new BigDecimal("1.19"))
                        .available(true)
                        .stale(false)
                        .build(),
                StockQuote.builder()
                        .symbol("sz000001")
                        .name("平安银行")
                        .price(new BigDecimal("9"))
                        .changeAmount(new BigDecimal("-0.20"))
                        .changePercent(new BigDecimal("-2.17"))
                        .available(true)
                        .stale(false)
                        .build()
        ));

        StockPortfolioSummary summary = service.summary();

        assertThat(summary.getTotalMarketValue()).isEqualByComparingTo("179000.00");
        assertThat(summary.getTotalCostAmount()).isEqualByComparingTo("160000.00");
        assertThat(summary.getFloatingPnl()).isEqualByComparingTo("19000.00");
        assertThat(summary.getFloatingPnlPercent()).isEqualByComparingTo("11.88");
        assertThat(summary.getTodayPnl()).isEqualByComparingTo("1800.00");
        assertThat(summary.getHoldingCount()).isEqualTo(2);
        assertThat(summary.getCalculatedAt()).isNotNull();
        assertThat(summary.getHoldings()).extracting("symbol").containsExactly("sh600519", "sz000001");
        assertThat(summary.getHoldings().get(0).getMarketValue()).isEqualByComparingTo("170000.00");
        assertThat(summary.getHoldings().get(0).getFloatingPnl()).isEqualByComparingTo("20000.00");
        assertThat(summary.getHoldings().get(0).getFloatingPnlPercent()).isEqualByComparingTo("13.33");
        assertThat(summary.getHoldings().get(1).getMarketValue()).isEqualByComparingTo("9000.00");
        assertThat(summary.getHoldings().get(1).getFloatingPnl()).isEqualByComparingTo("-1000.00");
    }
}
