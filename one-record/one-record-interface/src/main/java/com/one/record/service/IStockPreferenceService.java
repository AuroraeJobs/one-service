package com.one.record.service;

import com.one.record.stock.StockPreference;

public interface IStockPreferenceService {

    StockPreference get();

    StockPreference save(StockPreference preference);
}
