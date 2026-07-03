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
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
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
        lenient().when(positionRepository.findByUserIdAndAccountIdIsNullAndSymbol(any(), any())).thenReturn(java.util.Optional.empty());
        lenient().when(positionRepository.findByUserIdAndAccountIdAndSymbol(any(), any(), any())).thenReturn(java.util.Optional.empty());
        lenient().when(positionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(tradeRepository.findByUserIdAndAccountIdIsNullAndSymbolOrderByTradedAtAscCreatedAtAsc(any(), any())).thenReturn(List.of());
        lenient().when(tradeRepository.findByUserIdAndAccountIdAndSymbolOrderByTradedAtAscCreatedAtAsc(any(), any(), any())).thenReturn(List.of());
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

    @Test
    void recalculatePositionUsesWeightedAverageCostAfterBuyAndSell() {
        when(stockMarketService.normalizeSymbol("600519")).thenReturn("sh600519");
        when(tradeRepository.findByUserIdAndAccountIdAndSymbolOrderByTradedAtAscCreatedAtAsc("default", "acc1", "sh600519"))
                .thenReturn(List.of(
                        StockTrade.builder()
                                .accountId("acc1")
                                .symbol("sh600519")
                                .name("贵州茅台")
                                .tradeType("BUY")
                                .quantity(new BigDecimal("100"))
                                .price(new BigDecimal("10"))
                                .fee(new BigDecimal("1"))
                                .tradedAt(1000L)
                                .build(),
                        StockTrade.builder()
                                .accountId("acc1")
                                .symbol("sh600519")
                                .name("贵州茅台")
                                .tradeType("BUY")
                                .quantity(new BigDecimal("100"))
                                .price(new BigDecimal("20"))
                                .fee(new BigDecimal("1"))
                                .tradedAt(2000L)
                                .build(),
                        StockTrade.builder()
                                .accountId("acc1")
                                .symbol("sh600519")
                                .name("贵州茅台")
                                .tradeType("SELL")
                                .quantity(new BigDecimal("50"))
                                .price(new BigDecimal("30"))
                                .tradedAt(3000L)
                                .build()
                ));

        StockPosition position = service.recalculatePosition("acc1", "600519");

        assertThat(position.getAccountId()).isEqualTo("acc1");
        assertThat(position.getSymbol()).isEqualTo("sh600519");
        assertThat(position.getQuantity()).isEqualByComparingTo("150");
        assertThat(position.getAvailableQuantity()).isEqualByComparingTo("150");
        assertThat(position.getCostAmount()).isEqualByComparingTo("2251.50");
        assertThat(position.getCostPrice()).isEqualByComparingTo("15.01");
        assertThat(position.getOpenedAt()).isEqualTo(1000L);
        assertThat(position.getUpdatedAt()).isNotNull();
    }

    @Test
    void deleteTradeRecalculatesAffectedPosition() {
        StockTrade existing = StockTrade.builder()
                .id("t1")
                .accountId("acc1")
                .symbol("sh600519")
                .tradeType("BUY")
                .quantity(new BigDecimal("100"))
                .price(new BigDecimal("10"))
                .build();
        when(tradeRepository.findByIdAndUserId("t1", "default")).thenReturn(java.util.Optional.of(existing));
        when(tradeRepository.findByUserIdAndAccountIdAndSymbolOrderByTradedAtAscCreatedAtAsc("default", "acc1", "sh600519"))
                .thenReturn(List.of());

        service.deleteTrade("t1");

        verify(tradeRepository).deleteById("t1");
        ArgumentCaptor<StockPosition> captor = ArgumentCaptor.forClass(StockPosition.class);
        verify(positionRepository).save(captor.capture());
        assertThat(captor.getValue().getAccountId()).isEqualTo("acc1");
        assertThat(captor.getValue().getSymbol()).isEqualTo("sh600519");
        assertThat(captor.getValue().getQuantity()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(captor.getValue().getCostAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void recalculatePositionHandlesFeeTaxDividendBonusShareSplitAndIsIdempotent() {
        when(stockMarketService.normalizeSymbol("600519")).thenReturn("sh600519");
        when(tradeRepository.findByUserIdAndAccountIdAndSymbolOrderByTradedAtAscCreatedAtAsc("default", "acc1", "sh600519"))
                .thenReturn(complexTradeFlow());

        StockPosition first = service.recalculatePosition("acc1", "600519");
        StockPosition second = service.recalculatePosition("acc1", "600519");

        assertThat(first.getQuantity()).isEqualByComparingTo("200");
        assertThat(first.getAvailableQuantity()).isEqualByComparingTo("200");
        assertThat(first.getCostAmount()).isEqualByComparingTo("910.00");
        assertThat(first.getCostPrice()).isEqualByComparingTo("4.55");
        assertThat(second.getQuantity()).isEqualByComparingTo(first.getQuantity());
        assertThat(second.getCostAmount()).isEqualByComparingTo(first.getCostAmount());
        assertThat(second.getCostPrice()).isEqualByComparingTo(first.getCostPrice());
    }

    @Test
    void summaryExposesRealizedPnlAndDividendIncomeFromTrades() {
        when(positionRepository.findByUserIdOrderBySymbolAscCreatedAtAsc("default")).thenReturn(List.of(
                StockPosition.builder()
                        .id("p1")
                        .accountId("acc1")
                        .symbol("sh600519")
                        .market("sh")
                        .code("600519")
                        .name("贵州茅台")
                        .quantity(new BigDecimal("200"))
                        .costPrice(new BigDecimal("4.55"))
                        .costAmount(new BigDecimal("910"))
                        .build()
        ));
        when(tradeRepository.findByUserIdAndAccountIdAndSymbolOrderByTradedAtAscCreatedAtAsc("default", "acc1", "sh600519"))
                .thenReturn(complexTradeFlow());
        when(stockMarketService.quotes(List.of("sh600519"))).thenReturn(List.of(
                StockQuote.builder()
                        .symbol("sh600519")
                        .name("贵州茅台")
                        .price(new BigDecimal("5"))
                        .changeAmount(new BigDecimal("0.10"))
                        .changePercent(new BigDecimal("2"))
                        .available(true)
                        .stale(false)
                        .build()
        ));

        StockPortfolioSummary summary = service.summary();

        assertThat(summary.getTotalMarketValue()).isEqualByComparingTo("1000.00");
        assertThat(summary.getTotalCostAmount()).isEqualByComparingTo("910.00");
        assertThat(summary.getFloatingPnl()).isEqualByComparingTo("90.00");
        assertThat(summary.getRealizedPnl()).isEqualByComparingTo("206.00");
        assertThat(summary.getDividendIncome()).isEqualByComparingTo("50.00");
        assertThat(summary.getHoldings().get(0).getRealizedPnl()).isEqualByComparingTo("206.00");
        assertThat(summary.getHoldings().get(0).getDividendIncome()).isEqualByComparingTo("50.00");
    }

    private List<StockTrade> complexTradeFlow() {
        return List.of(
                StockTrade.builder()
                        .accountId("acc1")
                        .symbol("sh600519")
                        .tradeType("BUY")
                        .quantity(new BigDecimal("100"))
                        .price(new BigDecimal("10"))
                        .fee(new BigDecimal("1"))
                        .tax(BigDecimal.ZERO)
                        .tradedAt(1000L)
                        .build(),
                StockTrade.builder()
                        .accountId("acc1")
                        .symbol("sh600519")
                        .tradeType("DIVIDEND")
                        .amount(new BigDecimal("50"))
                        .tradedAt(1500L)
                        .build(),
                StockTrade.builder()
                        .accountId("acc1")
                        .symbol("sh600519")
                        .tradeType("BONUS_SHARE")
                        .quantity(new BigDecimal("10"))
                        .tradedAt(2000L)
                        .build(),
                StockTrade.builder()
                        .accountId("acc1")
                        .symbol("sh600519")
                        .tradeType("SPLIT")
                        .quantity(new BigDecimal("2"))
                        .tradedAt(2500L)
                        .build(),
                StockTrade.builder()
                        .accountId("acc1")
                        .symbol("sh600519")
                        .tradeType("SELL")
                        .quantity(new BigDecimal("20"))
                        .price(new BigDecimal("15"))
                        .fee(new BigDecimal("2"))
                        .tax(new BigDecimal("1"))
                        .tradedAt(3000L)
                        .build()
        );
    }
}
