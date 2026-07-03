package com.one.record.web;

import com.one.record.service.IStockMarketService;
import com.one.record.stock.StockProviderHealth;
import com.one.record.stock.StockQuote;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("stock")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class StockMarketController {

    private final IStockMarketService service;

    @GetMapping("quote")
    @Operation(summary = "查询股票实时行情", description = "对接第三方行情系统，查询单个股票实时行情")
    public StockQuote quote(@RequestParam("symbol") String symbol) {
        log.info("Fetching stock quote: {}", symbol);
        return service.quote(symbol);
    }

    @GetMapping("quotes")
    @Operation(summary = "批量查询股票实时行情", description = "对接第三方行情系统，批量查询股票实时行情")
    public List<StockQuote> quotes(@RequestParam(name = "symbols", required = false) List<String> symbols) {
        log.info("Fetching stock quotes: {}", symbols);
        return service.quotes(symbols);
    }

    @GetMapping("providers/health")
    @Operation(summary = "查询股票行情源状态", description = "查询已注册和已配置的股票行情源状态")
    public List<StockProviderHealth> providerHealth() {
        return service.providerHealth();
    }
}
