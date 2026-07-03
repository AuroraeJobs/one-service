package com.one.record.service.impl;

import com.one.record.repository.StockKLineRepository;
import com.one.record.service.IStockPortfolioService;
import com.one.record.stock.StockAnalysisSummary;
import com.one.record.stock.StockHoldingSummary;
import com.one.record.stock.StockKLine;
import com.one.record.stock.StockPortfolioSummary;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StockAnalysisServiceTest {

    private IStockPortfolioService portfolioService;

    private StockKLineRepository kLineRepository;

    private StockAnalysisService service;

    @BeforeEach
    void setUp() {
        portfolioService = mock(IStockPortfolioService.class);
        kLineRepository = mock(StockKLineRepository.class);
        service = new StockAnalysisService(portfolioService, kLineRepository);
    }

    @Test
    void summaryCalculatesConcentrationVolatilityDrawdownAndRankings() {
        when(portfolioService.summary()).thenReturn(StockPortfolioSummary.builder()
                .totalMarketValue(new BigDecimal("200000"))
                .holdings(List.of(
                        holding("sh600519", "贵州茅台", "150000", "4.20", "3000"),
                        holding("sz000001", "平安银行", "50000", "-1.50", "-500")
                ))
                .build());
        when(kLineRepository.findTop60BySymbolAndPeriodOrderByTradeDateDesc("sh600519", "daily"))
                .thenReturn(List.of(
                        kLine("2026-07-03", "100", "90", "-3"),
                        kLine("2026-07-02", "100", "120", "5")
                ));
        when(kLineRepository.findTop60BySymbolAndPeriodOrderByTradeDateDesc("sz000001", "daily"))
                .thenReturn(List.of(
                        kLine("2026-07-03", "10", "8", "-2"),
                        kLine("2026-07-02", "10", "10", "1")
                ));

        StockAnalysisSummary summary = service.summary();

        assertThat(summary.getConcentrationSymbol()).isEqualTo("sh600519");
        assertThat(summary.getConcentrationPercent()).isEqualByComparingTo("75.00");
        assertThat(summary.getConcentration()).hasSize(2);
        assertThat(summary.getTopGainers()).extracting("symbol").containsExactly("sh600519", "sz000001");
        assertThat(summary.getTopLosers()).extracting("symbol").containsExactly("sz000001", "sh600519");
        assertThat(summary.getVolatility().get(0).getSymbol()).isEqualTo("sh600519");
        assertThat(summary.getVolatility().get(0).getPercent()).isEqualByComparingTo("4.00");
        assertThat(summary.getDrawdown().get(0).getSymbol()).isEqualTo("sh600519");
        assertThat(summary.getDrawdown().get(0).getPercent()).isEqualByComparingTo("25.00");
        assertThat(summary.getCalculatedAt()).isNotNull();
    }

    private StockHoldingSummary holding(String symbol, String name, String marketValue, String changePercent, String todayPnl) {
        return StockHoldingSummary.builder()
                .symbol(symbol)
                .name(name)
                .marketValue(new BigDecimal(marketValue))
                .changePercent(new BigDecimal(changePercent))
                .todayPnl(new BigDecimal(todayPnl))
                .build();
    }

    private StockKLine kLine(String tradeDate, String open, String close, String changePercent) {
        return StockKLine.builder()
                .tradeDate(tradeDate)
                .open(new BigDecimal(open))
                .close(new BigDecimal(close))
                .changePercent(new BigDecimal(changePercent))
                .build();
    }
}
