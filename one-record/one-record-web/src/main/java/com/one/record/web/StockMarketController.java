package com.one.record.web;

import com.one.record.service.IStockMarketService;
import com.one.record.stock.StockProviderHealth;
import com.one.record.stock.StockProviderProbeResult;
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

    @GetMapping("providers/probe")
    @Operation(summary = "探测股票数据源", description = "通过 Provider Router 拉取样本数据，验证当前股票数据源是否可用")
    public StockProviderProbeResult providerProbe(@RequestParam(name = "category", required = false) String category,
                                                  @RequestParam(name = "symbol", required = false) String symbol) {
        log.info("Probing stock provider: category={}, symbol={}", category, symbol);
        return service.providerProbe(category, symbol);
    }

    @GetMapping("providers/probe/latest")
    @Operation(summary = "查询最近一次股票数据源探测", description = "从 Redis 查询最近一次 Provider 探测结果")
    public StockProviderProbeResult latestProviderProbe(@RequestParam(name = "category", required = false) String category) {
        return service.latestProviderProbe(category);
    }
}
