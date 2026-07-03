package com.one.record.service.impl;

import com.one.record.repository.StockKLineRepository;
import com.one.record.service.IStockAnalysisService;
import com.one.record.service.IStockPortfolioService;
import com.one.record.stock.StockAnalysisItem;
import com.one.record.stock.StockAnalysisSummary;
import com.one.record.stock.StockHoldingSummary;
import com.one.record.stock.StockKLine;
import com.one.record.stock.StockPortfolioSummary;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;

@Service
@AllArgsConstructor
public class StockAnalysisService implements IStockAnalysisService {

    private static final String DAILY_PERIOD = "daily";

    private final IStockPortfolioService portfolioService;

    private final StockKLineRepository kLineRepository;

    @Override
    public StockAnalysisSummary summary() {
        StockPortfolioSummary portfolio = portfolioService.summary();
        List<StockHoldingSummary> holdings = portfolio.getHoldings() == null ? List.of() : portfolio.getHoldings();
        BigDecimal totalMarketValue = defaultAmount(portfolio.getTotalMarketValue());

        List<StockAnalysisItem> concentration = holdings.stream()
                .sorted(Comparator.comparing(StockHoldingSummary::getMarketValue, Comparator.nullsLast(BigDecimal::compareTo)).reversed())
                .limit(5)
                .map(holding -> StockAnalysisItem.builder()
                        .symbol(holding.getSymbol())
                        .name(holding.getName())
                        .value(scaleMoney(holding.getMarketValue()))
                        .percent(percent(holding.getMarketValue(), totalMarketValue))
                        .message("市值占比")
                        .build())
                .toList();
        List<StockAnalysisItem> volatility = holdings.stream()
                .map(this::volatilityItem)
                .sorted(Comparator.comparing(StockAnalysisItem::getPercent, Comparator.nullsLast(BigDecimal::compareTo)).reversed())
                .toList();
        List<StockAnalysisItem> drawdown = holdings.stream()
                .map(this::drawdownItem)
                .sorted(Comparator.comparing(StockAnalysisItem::getPercent, Comparator.nullsLast(BigDecimal::compareTo)).reversed())
                .toList();
        return StockAnalysisSummary.builder()
                .concentrationPercent(concentration.isEmpty() ? BigDecimal.ZERO : concentration.get(0).getPercent())
                .concentrationSymbol(concentration.isEmpty() ? null : concentration.get(0).getSymbol())
                .concentration(concentration)
                .volatility(volatility)
                .drawdown(drawdown)
                .topGainers(topGainers(holdings))
                .topLosers(topLosers(holdings))
                .calculatedAt(System.currentTimeMillis())
                .build();
    }

    private List<StockAnalysisItem> topGainers(List<StockHoldingSummary> holdings) {
        return holdings.stream()
                .filter(holding -> holding.getChangePercent() != null)
                .sorted(Comparator.comparing(StockHoldingSummary::getChangePercent, Comparator.nullsLast(BigDecimal::compareTo)).reversed())
                .limit(5)
                .map(holding -> changeItem(holding, "涨幅"))
                .toList();
    }

    private List<StockAnalysisItem> topLosers(List<StockHoldingSummary> holdings) {
        return holdings.stream()
                .filter(holding -> holding.getChangePercent() != null)
                .sorted(Comparator.comparing(StockHoldingSummary::getChangePercent, Comparator.nullsLast(BigDecimal::compareTo)))
                .limit(5)
                .map(holding -> changeItem(holding, "跌幅"))
                .toList();
    }

    private StockAnalysisItem changeItem(StockHoldingSummary holding, String message) {
        return StockAnalysisItem.builder()
                .symbol(holding.getSymbol())
                .name(holding.getName())
                .value(scaleMoney(holding.getTodayPnl()))
                .percent(scalePercent(holding.getChangePercent()))
                .message(message)
                .build();
    }

    private StockAnalysisItem volatilityItem(StockHoldingSummary holding) {
        List<StockKLine> kLines = recentKLines(holding.getSymbol());
        BigDecimal averageChange = kLines.stream()
                .map(StockKLine::getChangePercent)
                .filter(value -> value != null)
                .map(BigDecimal::abs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal percent = kLines.isEmpty() ? BigDecimal.ZERO : averageChange.divide(BigDecimal.valueOf(kLines.size()), 2, RoundingMode.HALF_UP);
        return StockAnalysisItem.builder()
                .symbol(holding.getSymbol())
                .name(holding.getName())
                .percent(percent)
                .message("近60日平均绝对涨跌幅")
                .build();
    }

    private StockAnalysisItem drawdownItem(StockHoldingSummary holding) {
        List<StockKLine> kLines = recentKLines(holding.getSymbol()).stream()
                .sorted(Comparator.comparing(StockKLine::getTradeDate))
                .toList();
        BigDecimal peak = BigDecimal.ZERO;
        BigDecimal maxDrawdown = BigDecimal.ZERO;
        for (StockKLine kLine : kLines) {
            BigDecimal close = defaultAmount(kLine.getClose());
            if (close.compareTo(peak) > 0) {
                peak = close;
            }
            if (peak.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal drawdown = peak.subtract(close).multiply(BigDecimal.valueOf(100)).divide(peak, 2, RoundingMode.HALF_UP);
                if (drawdown.compareTo(maxDrawdown) > 0) {
                    maxDrawdown = drawdown;
                }
            }
        }
        return StockAnalysisItem.builder()
                .symbol(holding.getSymbol())
                .name(holding.getName())
                .percent(maxDrawdown)
                .message("近60日最大回撤")
                .build();
    }

    private List<StockKLine> recentKLines(String symbol) {
        return symbol == null ? List.of() : kLineRepository.findTop60BySymbolAndPeriodOrderByTradeDateDesc(symbol, DAILY_PERIOD);
    }

    private BigDecimal percent(BigDecimal value, BigDecimal total) {
        BigDecimal safeTotal = defaultAmount(total);
        if (safeTotal.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return defaultAmount(value).multiply(BigDecimal.valueOf(100)).divide(safeTotal, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal scaleMoney(BigDecimal value) {
        return defaultAmount(value).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal scalePercent(BigDecimal value) {
        return defaultAmount(value).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal defaultAmount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
