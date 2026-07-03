package com.one.record.service;

import com.one.record.stock.StockAccount;
import com.one.record.stock.StockPosition;
import com.one.record.stock.StockTrade;

import java.util.List;

public interface IStockPortfolioService {

    List<StockAccount> accounts();

    StockAccount saveAccount(StockAccount account);

    StockAccount updateAccount(String id, StockAccount account);

    void deleteAccount(String id);

    List<StockPosition> positions(String accountId);

    StockPosition savePosition(StockPosition position);

    StockPosition updatePosition(String id, StockPosition position);

    void deletePosition(String id);

    List<StockTrade> trades(String accountId, String symbol);

    StockTrade saveTrade(StockTrade trade);

    StockTrade updateTrade(String id, StockTrade trade);

    void deleteTrade(String id);
}
