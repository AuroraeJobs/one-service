package com.one.record.web;

import com.one.record.lottery.LotterySimulationRequest;
import com.one.record.lottery.LotterySimulationResult;
import com.one.record.service.ILotterySimulationService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("lottery/simulations")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class LotterySimulationController {

    private final ILotterySimulationService service;

    @PostMapping("run")
    @Operation(summary = "运行彩票沙盘模拟", description = "基于候选票据、预算、策略组合和最近预测证据生成 what-if 模拟，不保存票据")
    public LotterySimulationResult run(@RequestBody(required = false) LotterySimulationRequest request) {
        return service.simulate(request);
    }
}
