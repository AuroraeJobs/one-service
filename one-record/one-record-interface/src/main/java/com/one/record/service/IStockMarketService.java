package com.one.record.service;

import com.one.record.stock.StockQuote;
import com.one.record.stock.StockProviderHealth;

import java.util.List;

public interface IStockMarketService {

    StockQuote quote(String symbol);

    List<StockQuote> quotes(List<String> symbols);

    String normalizeSymbol(String symbol);

    List<StockProviderHealth> providerHealth();
}
