package com.one.record.web;

import com.one.record.lottery.LotteryBacktestRunRequest;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryBacktestReport;
import com.one.record.service.ILotteryBacktestService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("lottery/backtests")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class LotteryBacktestController {

    private final ILotteryBacktestService service;

    @PostMapping("run")
    @Operation(summary = "运行彩票回测", description = "基于历史开奖记录生成可复盘回测报告")
    public LotteryBacktestReport run(@RequestBody(required = false) LotteryBacktestRunRequest request) {
        return service.run(request);
    }

    @GetMapping
    @Operation(summary = "分页查询彩票回测报告", description = "按策略、窗口和创建时间筛选回测报告")
    public LotteryPageResponse<LotteryBacktestReport> reports(
            @RequestParam(name = "page", required = false, defaultValue = "0") Integer page,
            @RequestParam(name = "pageSize", required = false, defaultValue = "20") Integer pageSize,
            @RequestParam(name = "strategyName", required = false) String strategyName,
            @RequestParam(name = "presetWindow", required = false) String presetWindow,
            @RequestParam(name = "createdStartAt", required = false) Long createdStartAt,
            @RequestParam(name = "createdEndAt", required = false) Long createdEndAt) {
        return service.reports(page, pageSize, strategyName, presetWindow, createdStartAt, createdEndAt);
    }

    @GetMapping("{id}")
    @Operation(summary = "查询彩票回测报告详情", description = "按 ID 查询回测报告、回放行和资金模拟")
    public LotteryBacktestReport detail(@PathVariable("id") String id) {
        return service.detail(id);
    }
}
