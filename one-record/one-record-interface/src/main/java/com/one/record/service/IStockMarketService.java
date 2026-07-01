package com.one.record.service;

import com.one.record.stock.StockQuote;

import java.util.List;

public interface IStockMarketService {

    StockQuote quote(String symbol);

    List<StockQuote> quotes(List<String> symbols);
}
