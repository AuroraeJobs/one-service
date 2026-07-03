package com.one.record.web;

import com.one.record.service.IStockAnalysisService;
import com.one.record.stock.StockAnalysisSummary;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("stock/analysis")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class StockAnalysisController {

    private final IStockAnalysisService service;

    @GetMapping("summary")
    @Operation(summary = "查询股票分析汇总", description = "查询持仓集中度、波动、回撤和涨跌榜")
    public StockAnalysisSummary summary() {
        return service.summary();
    }
}
