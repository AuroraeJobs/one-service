package com.one.record.service;

import com.one.record.stock.StockKLine;

import java.util.List;

public interface StockKLineProvider {

    String name();

    List<StockKLine> dailyKLines(String symbol, String startDate, String endDate);
}
