package com.one.record.service;

import com.one.record.stock.StockQuote;

import java.util.List;

public interface StockMarketProvider {

    String name();

    List<StockQuote> quotes(List<String> symbols);
}
