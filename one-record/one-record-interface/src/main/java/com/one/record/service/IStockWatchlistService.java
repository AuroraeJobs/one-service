package com.one.record.service;

import com.one.record.stock.StockWatchlist;

import java.util.List;

public interface IStockWatchlistService {

    StockWatchlist save(StockWatchlist watchlist);

    void delete(String symbol);

    List<StockWatchlist> findAll();

    List<StockWatchlist> updateOrder(List<String> symbols);
}
