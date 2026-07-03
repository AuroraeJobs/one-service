package com.one.record.service;

import com.one.record.stock.StockAlertHistory;
import com.one.record.stock.StockAlertRule;

import java.util.List;

public interface IStockAlertService {

    List<StockAlertRule> rules(Boolean enabled);

    StockAlertRule saveRule(StockAlertRule rule);

    StockAlertRule updateRule(String id, StockAlertRule rule);

    void deleteRule(String id);

    List<StockAlertHistory> history(String symbol);
}
