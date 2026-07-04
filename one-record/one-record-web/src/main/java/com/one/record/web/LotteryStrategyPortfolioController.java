package com.one.record.web;

import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryStrategyPortfolioSummary;
import com.one.record.model.LotteryStrategyPortfolio;
import com.one.record.service.ILotteryStrategyPortfolioService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("lottery/strategy-portfolios")
@AllArgsConstructor
public class LotteryStrategyPortfolioController {

    private final ILotteryStrategyPortfolioService service;

    @GetMapping
    @Operation(summary = "分页查询彩票策略组合", description = "返回策略组合及规则、实验、回测、决策和笔记证据摘要")
    public LotteryPageResponse<LotteryStrategyPortfolioSummary> portfolios(
            @RequestParam(value = "includeArchived", required = false, defaultValue = "false") Boolean includeArchived,
            @RequestParam(value = "page", required = false, defaultValue = "1") Integer page,
            @RequestParam(value = "pageSize", required = false, defaultValue = "20") Integer pageSize) {
        return service.portfolios(includeArchived, page, pageSize);
    }

    @GetMapping("{id}")
    @Operation(summary = "查询彩票策略组合详情", description = "返回单个策略组合和证据覆盖、健康、ROI、警示摘要")
    public LotteryStrategyPortfolioSummary detail(@PathVariable("id") String id) {
        return service.detail(id);
    }

    @PostMapping
    @Operation(summary = "创建彩票策略组合", description = "保存组合名称、分配权重、证据引用和标签")
    public LotteryStrategyPortfolioSummary create(@RequestBody LotteryStrategyPortfolio portfolio) {
        return service.create(portfolio);
    }

    @PutMapping("{id}")
    @Operation(summary = "更新彩票策略组合", description = "更新组合分配、状态、证据引用和标签")
    public LotteryStrategyPortfolioSummary update(@PathVariable("id") String id,
                                                  @RequestBody LotteryStrategyPortfolio portfolio) {
        return service.update(id, portfolio);
    }

    @PatchMapping("{id}/archive")
    @Operation(summary = "归档彩票策略组合", description = "将策略组合标记为归档")
    public LotteryStrategyPortfolioSummary archive(@PathVariable("id") String id) {
        return service.archive(id);
    }
}
