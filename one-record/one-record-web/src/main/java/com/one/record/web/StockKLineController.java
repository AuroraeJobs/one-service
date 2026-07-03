package com.one.record.web;

import com.one.record.service.IStockKLineService;
import com.one.record.stock.StockKLine;
import com.one.record.stock.StockKLineSyncLog;
import com.one.record.stock.StockKLineSyncSummary;
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
    public List<StockKLine> sync(@PathVariable("symbol") String symbol, @RequestBody(required = false) List<StockKLine> kLines) {
        log.info("Syncing stock klines: symbol={}, size={}", symbol, kLines == null ? 0 : kLines.size());
        return service.sync(symbol, kLines);
    }

    @PostMapping("klines/sync")
    @Operation(summary = "批量同步股票K线", description = "导入或更新多只股票的历史K线数据")
    public List<StockKLine> syncAll(@RequestBody(required = false) List<StockKLine> kLines) {
        log.info("Syncing stock klines in batch: size={}", kLines == null ? 0 : kLines.size());
        return service.syncAll(kLines);
    }

    @PostMapping("klines/sync/retry")
    @Operation(summary = "重试批量K线同步", description = "按后端配置的股票列表重试 provider-backed K线同步")
    public List<StockKLine> retryConfiguredSync() {
        log.info("Retrying configured stock kline sync");
        return service.retryConfiguredSync();
    }

    @PostMapping("klines/sync/scheduled")
    @Operation(summary = "手动触发K线定时同步", description = "按定时任务语义立即执行一次配置股票列表的 provider-backed K线同步")
    public StockKLineSyncLog triggerScheduledSync() {
        log.info("Triggering scheduled stock kline sync manually");
        return service.scheduledDailySync();
    }

    @GetMapping("klines/sync-logs")
    @Operation(summary = "查询股票K线同步日志", description = "查询最近的股票K线同步日志")
    public List<StockKLineSyncLog> syncLogs(@RequestParam(name = "symbol", required = false) String symbol) {
        return service.syncLogs(symbol);
    }

    @GetMapping("klines/sync-summary")
    @Operation(summary = "查询股票K线同步摘要", description = "按最近同步日志汇总K线同步状态")
    public StockKLineSyncSummary syncSummary(@RequestParam(name = "symbol", required = false) String symbol) {
        return service.syncSummary(symbol);
    }
}
