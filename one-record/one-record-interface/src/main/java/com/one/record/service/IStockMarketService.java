package com.one.record.service;

import com.one.record.stock.StockQuote;
import com.one.record.stock.StockProviderConfig;
import com.one.record.stock.StockProviderHealth;
import com.one.record.stock.StockProviderProbeResult;

import java.util.List;

public interface IStockMarketService {

    StockQuote quote(String symbol);

    List<StockQuote> quotes(List<String> symbols);

    String normalizeSymbol(String symbol);

    default String market(String symbol) {
        if (symbol == null) {
            return "";
        }
        return symbol.length() > 2 ? symbol.substring(0, 2) : "";
    }

    default String code(String symbol) {
        if (symbol == null) {
            return "";
        }
        return symbol.length() > 2 ? symbol.substring(2) : symbol;
    }

    List<StockProviderHealth> providerHealth();

    StockProviderConfig providerConfig();

    StockProviderProbeResult providerProbe(String category, String symbol);

    List<StockProviderProbeResult> providerProbeAll(String symbol);

    StockProviderProbeResult latestProviderProbe(String category);
}
