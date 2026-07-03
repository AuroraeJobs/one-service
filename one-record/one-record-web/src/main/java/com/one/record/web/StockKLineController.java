package com.one.record.web;

import com.one.record.service.IStockKLineService;
import com.one.record.stock.StockKLine;
import com.one.record.stock.StockKLineSyncLog;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("stock")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class StockKLineController {

    private final IStockKLineService service;

    @GetMapping("{symbol}/klines")
    @Operation(summary = "查询股票K线", description = "查询指定股票的历史K线数据")
    public List<StockKLine> find(@PathVariable("symbol") String symbol,
                                 @RequestParam(name = "period", required = false) String period,
                                 @RequestParam(name = "startDate", required = false) String startDate,
                                 @RequestParam(name = "endDate", required = false) String endDate) {
        log.info("Fetching stock klines: symbol={}, period={}, startDate={}, endDate={}", symbol, period, startDate, endDate);
        return service.find(symbol, period, startDate, endDate);
    }

    @PostMapping("{symbol}/klines/sync")
    @Operation(summary = "同步单只股票K线", description = "导入或更新指定股票的历史K线数据")
    public List<StockKLine> sync(@PathVariable("symbol") String symbol, @RequestBody List<StockKLine> kLines) {
        log.info("Syncing stock klines: symbol={}, size={}", symbol, kLines == null ? 0 : kLines.size());
        return service.sync(symbol, kLines);
    }

    @PostMapping("klines/sync")
    @Operation(summary = "批量同步股票K线", description = "导入或更新多只股票的历史K线数据")
    public List<StockKLine> syncAll(@RequestBody List<StockKLine> kLines) {
        log.info("Syncing stock klines in batch: size={}", kLines == null ? 0 : kLines.size());
        return service.syncAll(kLines);
    }

    @GetMapping("klines/sync-logs")
    @Operation(summary = "查询股票K线同步日志", description = "查询最近的股票K线同步日志")
    public List<StockKLineSyncLog> syncLogs(@RequestParam(name = "symbol", required = false) String symbol) {
        return service.syncLogs(symbol);
    }
}
