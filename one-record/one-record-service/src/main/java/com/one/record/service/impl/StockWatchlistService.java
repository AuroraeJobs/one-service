package com.one.record.service.impl;

import com.one.common.exception.DuplicateException;
import com.one.common.exception.NotFoundException;
import com.one.common.exception.ServiceException;
import com.one.record.repository.StockWatchlistRepository;
import com.one.record.service.IStockMarketService;
import com.one.record.service.IStockWatchlistService;
import com.one.record.stock.StockQuote;
import com.one.record.stock.StockWatchlist;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@AllArgsConstructor
public class StockWatchlistService implements IStockWatchlistService {

    private static final String DEFAULT_USER_ID = "default";

    private final StockWatchlistRepository repository;

    private final IStockMarketService stockMarketService;

    @Override
    public StockWatchlist save(StockWatchlist watchlist) {
        if (watchlist == null) {
            throw new ServiceException("自选股不能为空");
        }
        String symbol = stockMarketService.normalizeSymbol(watchlist.getSymbol());
        if (symbol == null || symbol.isBlank()) {
            throw new ServiceException("股票代码不能为空");
        }
        if (repository.existsByUserIdAndSymbol(DEFAULT_USER_ID, symbol)) {
            throw new DuplicateException("自选股已存在: {}", symbol);
        }

        Long now = System.currentTimeMillis();
        StockWatchlist item = StockWatchlist.builder()
                .userId(DEFAULT_USER_ID)
                .symbol(symbol)
                .market(market(symbol))
                .code(code(symbol))
                .name(resolveName(symbol, watchlist.getName()))
                .sortOrder(nextSortOrder())
                .createdAt(now)
                .updatedAt(now)
                .build();
        return repository.save(item);
    }

    @Override
    public void delete(String symbol) {
        String normalizedSymbol = stockMarketService.normalizeSymbol(symbol);
        StockWatchlist existing = repository.findByUserIdAndSymbol(DEFAULT_USER_ID, normalizedSymbol)
                .orElseThrow(() -> new NotFoundException("自选股不存在: {}", normalizedSymbol));
        repository.deleteById(existing.getId());
    }

    @Override
    public List<StockWatchlist> findAll() {
        return repository.findByUserIdOrderBySortOrderAscCreatedAtAsc(DEFAULT_USER_ID);
    }

    @Override
    public List<StockWatchlist> updateOrder(List<String> symbols) {
        if (symbols == null || symbols.isEmpty()) {
            return findAll();
        }

        List<StockWatchlist> updated = new ArrayList<>();
        int sortOrder = 0;
        for (String symbol : symbols) {
            String normalizedSymbol = stockMarketService.normalizeSymbol(symbol);
            StockWatchlist existing = repository.findByUserIdAndSymbol(DEFAULT_USER_ID, normalizedSymbol)
                    .orElseThrow(() -> new NotFoundException("自选股不存在: {}", normalizedSymbol));
            existing.setSortOrder(sortOrder++);
            existing.setUpdatedAt(System.currentTimeMillis());
            updated.add(repository.save(existing));
        }
        return findAll();
    }

    private Integer nextSortOrder() {
        return Math.toIntExact(repository.countByUserId(DEFAULT_USER_ID));
    }

    private String resolveName(String symbol, String fallbackName) {
        if (fallbackName != null && !fallbackName.isBlank()) {
            return fallbackName.trim();
        }
        try {
            StockQuote quote = stockMarketService.quote(symbol);
            if (quote.getName() != null && !quote.getName().isBlank()) {
                return quote.getName();
            }
        } catch (RuntimeException ex) {
            log.warn("Failed to resolve stock name for watchlist symbol: {}", symbol, ex);
        }
        return symbol;
    }

    private String market(String symbol) {
        return symbol.length() > 2 ? symbol.substring(0, 2) : "";
    }

    private String code(String symbol) {
        return symbol.length() > 2 ? symbol.substring(2) : symbol;
    }
}
