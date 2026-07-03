package com.one.record.service;

import com.one.record.stock.StockKLine;
import com.one.record.stock.StockKLineSyncLog;

import java.util.List;

public interface IStockKLineService {

    List<StockKLine> find(String symbol, String period, String startDate, String endDate);

    StockKLine save(String symbol, StockKLine kLine);

    List<StockKLine> sync(String symbol, List<StockKLine> kLines);

    List<StockKLine> syncAll(List<StockKLine> kLines);

    List<StockKLine> retryConfiguredSync();

    StockKLineSyncLog scheduledDailySync();

    List<StockKLineSyncLog> syncLogs(String symbol);
}
