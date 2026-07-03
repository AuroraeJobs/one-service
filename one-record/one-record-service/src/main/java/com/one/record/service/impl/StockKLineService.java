package com.one.record.service.impl;

import com.one.common.exception.ServiceException;
import com.one.record.repository.StockKLineRepository;
import com.one.record.service.IStockKLineService;
import com.one.record.service.IStockMarketService;
import com.one.record.stock.StockKLine;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class StockKLineService implements IStockKLineService {

    private static final String DEFAULT_PERIOD = "daily";

    private static final String MIN_DATE = "0000-00-00";

    private static final String MAX_DATE = "9999-99-99";

    private final StockKLineRepository repository;

    private final IStockMarketService stockMarketService;

    @Override
    public List<StockKLine> find(String symbol, String period, String startDate, String endDate) {
        String normalizedSymbol = normalizeSymbol(symbol);
        String normalizedPeriod = normalizePeriod(period);
        String safeStartDate = StringUtils.hasText(startDate) ? startDate.trim() : MIN_DATE;
        String safeEndDate = StringUtils.hasText(endDate) ? endDate.trim() : MAX_DATE;
        return repository.findBySymbolAndPeriodAndTradeDateBetweenOrderByTradeDateAsc(
                normalizedSymbol, normalizedPeriod, safeStartDate, safeEndDate);
    }

    @Override
    public StockKLine save(String symbol, StockKLine kLine) {
        if (kLine == null) {
            throw new ServiceException("K线数据不能为空");
        }
        return saveNormalized(normalizeSymbol(valueOrDefault(symbol, kLine.getSymbol())), kLine);
    }

    @Override
    public List<StockKLine> sync(String symbol, List<StockKLine> kLines) {
        String normalizedSymbol = normalizeSymbol(symbol);
        return saveKLines(normalizedSymbol, kLines);
    }

    @Override
    public List<StockKLine> syncAll(List<StockKLine> kLines) {
        return saveKLines(null, kLines);
    }

    private List<StockKLine> saveKLines(String fixedSymbol, List<StockKLine> kLines) {
        if (kLines == null || kLines.isEmpty()) {
            return List.of();
        }

        List<StockKLine> saved = new ArrayList<>();
        for (StockKLine kLine : kLines) {
            String symbol = fixedSymbol == null ? normalizeSymbol(kLine == null ? null : kLine.getSymbol()) : fixedSymbol;
            saved.add(saveNormalized(symbol, kLine));
        }
        return saved;
    }

    private StockKLine saveNormalized(String symbol, StockKLine kLine) {
        if (kLine == null) {
            throw new ServiceException("K线数据不能为空");
        }
        if (!StringUtils.hasText(kLine.getTradeDate())) {
            throw new ServiceException("K线交易日期不能为空");
        }

        String period = normalizePeriod(kLine.getPeriod());
        StockKLine target = repository.findBySymbolAndPeriodAndTradeDate(symbol, period, kLine.getTradeDate().trim())
                .orElseGet(() -> {
                    StockKLine created = new StockKLine();
                    created.setCreatedAt(System.currentTimeMillis());
                    return created;
                });

        target.setSymbol(symbol);
        target.setMarket(market(symbol));
        target.setCode(code(symbol));
        target.setPeriod(period);
        target.setTradeDate(kLine.getTradeDate().trim());
        target.setOpen(kLine.getOpen());
        target.setClose(kLine.getClose());
        target.setHigh(kLine.getHigh());
        target.setLow(kLine.getLow());
        target.setVolume(kLine.getVolume());
        target.setAmount(kLine.getAmount());
        target.setChangeAmount(kLine.getChangeAmount());
        target.setChangePercent(kLine.getChangePercent());
        target.setSource(kLine.getSource());
        target.setUpdatedAt(System.currentTimeMillis());
        return repository.save(target);
    }

    private String normalizeSymbol(String symbol) {
        String normalizedSymbol = stockMarketService.normalizeSymbol(symbol);
        if (!StringUtils.hasText(normalizedSymbol)) {
            throw new ServiceException("股票代码不能为空");
        }
        return normalizedSymbol;
    }

    private String normalizePeriod(String period) {
        return StringUtils.hasText(period) ? period.trim().toLowerCase() : DEFAULT_PERIOD;
    }

    private String valueOrDefault(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }

    private String market(String symbol) {
        return symbol.length() > 2 ? symbol.substring(0, 2) : "";
    }

    private String code(String symbol) {
        return symbol.length() > 2 ? symbol.substring(2) : symbol;
    }
}
