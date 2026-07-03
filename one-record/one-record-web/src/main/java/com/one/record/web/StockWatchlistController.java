package com.one.record.web;

import com.one.record.service.IStockWatchlistService;
import com.one.record.stock.StockWatchlist;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("stock/watchlist")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class StockWatchlistController {

    private final IStockWatchlistService service;

    @GetMapping
    @Operation(summary = "查询股票自选列表", description = "查询当前用户的股票自选列表")
    public List<StockWatchlist> findAll() {
        return service.findAll();
    }

    @PostMapping
    @Operation(summary = "添加股票自选", description = "添加一个股票到自选列表")
    public StockWatchlist save(@RequestBody StockWatchlist watchlist) {
        log.info("Saving stock watchlist item: {}", watchlist);
        return service.save(watchlist);
    }

    @DeleteMapping("{symbol}")
    @Operation(summary = "删除股票自选", description = "按股票代码删除自选股")
    public void delete(@PathVariable String symbol) {
        log.info("Deleting stock watchlist item: {}", symbol);
        service.delete(symbol);
    }

    @PutMapping("order")
    @Operation(summary = "更新股票自选排序", description = "按传入股票代码顺序更新自选列表排序")
    public List<StockWatchlist> updateOrder(@RequestBody List<String> symbols) {
        log.info("Updating stock watchlist order: {}", symbols);
        return service.updateOrder(symbols);
    }
}
