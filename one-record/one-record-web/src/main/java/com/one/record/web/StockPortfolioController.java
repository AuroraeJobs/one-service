package com.one.record.web;

import com.one.record.service.IStockPortfolioService;
import com.one.record.stock.StockAccount;
import com.one.record.stock.StockPortfolioSummary;
import com.one.record.stock.StockPosition;
import com.one.record.stock.StockTrade;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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
public class StockPortfolioController {

    private final IStockPortfolioService service;

    @GetMapping("accounts")
    @Operation(summary = "查询股票账户", description = "查询当前用户的股票账户列表")
    public List<StockAccount> accounts() {
        return service.accounts();
    }

    @PostMapping("accounts")
    @Operation(summary = "新增股票账户", description = "新增一个股票账户")
    public StockAccount saveAccount(@RequestBody StockAccount account) {
        log.info("Saving stock account: {}", account);
        return service.saveAccount(account);
    }

    @PutMapping("accounts/{id}")
    @Operation(summary = "更新股票账户", description = "按账户ID更新股票账户")
    public StockAccount updateAccount(@PathVariable("id") String id, @RequestBody StockAccount account) {
        log.info("Updating stock account: id={}, account={}", id, account);
        return service.updateAccount(id, account);
    }

    @DeleteMapping("accounts/{id}")
    @Operation(summary = "删除股票账户", description = "按账户ID删除股票账户")
    public void deleteAccount(@PathVariable("id") String id) {
        log.info("Deleting stock account: {}", id);
        service.deleteAccount(id);
    }

    @GetMapping("positions")
    @Operation(summary = "查询股票持仓", description = "查询股票持仓，可按账户过滤")
    public List<StockPosition> positions(@RequestParam(name = "accountId", required = false) String accountId) {
        return service.positions(accountId);
    }

    @PostMapping("positions")
    @Operation(summary = "新增股票持仓", description = "新增一条股票持仓")
    public StockPosition savePosition(@RequestBody StockPosition position) {
        log.info("Saving stock position: {}", position);
        return service.savePosition(position);
    }

    @PutMapping("positions/{id}")
    @Operation(summary = "更新股票持仓", description = "按持仓ID更新股票持仓")
    public StockPosition updatePosition(@PathVariable("id") String id, @RequestBody StockPosition position) {
        log.info("Updating stock position: id={}, position={}", id, position);
        return service.updatePosition(id, position);
    }

    @DeleteMapping("positions/{id}")
    @Operation(summary = "删除股票持仓", description = "按持仓ID删除股票持仓")
    public void deletePosition(@PathVariable("id") String id) {
        log.info("Deleting stock position: {}", id);
        service.deletePosition(id);
    }

    @GetMapping("trades")
    @Operation(summary = "查询股票交易", description = "查询股票交易，可按账户或股票代码过滤")
    public List<StockTrade> trades(@RequestParam(name = "accountId", required = false) String accountId,
                                   @RequestParam(name = "symbol", required = false) String symbol) {
        return service.trades(accountId, symbol);
    }

    @PostMapping("trades")
    @Operation(summary = "新增股票交易", description = "新增一条股票交易")
    public StockTrade saveTrade(@RequestBody StockTrade trade) {
        log.info("Saving stock trade: {}", trade);
        return service.saveTrade(trade);
    }

    @PutMapping("trades/{id}")
    @Operation(summary = "更新股票交易", description = "按交易ID更新股票交易")
    public StockTrade updateTrade(@PathVariable("id") String id, @RequestBody StockTrade trade) {
        log.info("Updating stock trade: id={}, trade={}", id, trade);
        return service.updateTrade(id, trade);
    }

    @DeleteMapping("trades/{id}")
    @Operation(summary = "删除股票交易", description = "按交易ID删除股票交易")
    public void deleteTrade(@PathVariable("id") String id) {
        log.info("Deleting stock trade: {}", id);
        service.deleteTrade(id);
    }

    @GetMapping("portfolio/summary")
    @Operation(summary = "查询股票组合汇总", description = "查询当前股票持仓市值、浮动盈亏和当日盈亏")
    public StockPortfolioSummary summary() {
        return service.summary();
    }
}
