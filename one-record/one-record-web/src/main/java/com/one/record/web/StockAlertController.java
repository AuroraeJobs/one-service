package com.one.record.web;

import com.one.record.service.IStockAlertService;
import com.one.record.stock.StockAlertHistory;
import com.one.record.stock.StockAlertRule;
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
@RequestMapping("stock/alerts")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class StockAlertController {

    private final IStockAlertService service;

    @GetMapping("rules")
    @Operation(summary = "查询股票提醒规则", description = "查询股票提醒规则，可按启用状态过滤")
    public List<StockAlertRule> rules(@RequestParam(name = "enabled", required = false) Boolean enabled) {
        return service.rules(enabled);
    }

    @PostMapping("rules")
    @Operation(summary = "新增股票提醒规则", description = "新增一条股票提醒规则")
    public StockAlertRule saveRule(@RequestBody StockAlertRule rule) {
        log.info("Saving stock alert rule: {}", rule);
        return service.saveRule(rule);
    }

    @PutMapping("rules/{id}")
    @Operation(summary = "更新股票提醒规则", description = "按规则ID更新股票提醒规则")
    public StockAlertRule updateRule(@PathVariable("id") String id, @RequestBody StockAlertRule rule) {
        log.info("Updating stock alert rule: id={}, rule={}", id, rule);
        return service.updateRule(id, rule);
    }

    @DeleteMapping("rules/{id}")
    @Operation(summary = "删除股票提醒规则", description = "按规则ID删除股票提醒规则")
    public void deleteRule(@PathVariable("id") String id) {
        log.info("Deleting stock alert rule: {}", id);
        service.deleteRule(id);
    }

    @GetMapping("history")
    @Operation(summary = "查询股票提醒历史", description = "查询最近100条股票提醒触发历史，可按股票代码过滤")
    public List<StockAlertHistory> history(@RequestParam(name = "symbol", required = false) String symbol) {
        return service.history(symbol);
    }
}
