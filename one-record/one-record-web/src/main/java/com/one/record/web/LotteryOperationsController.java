package com.one.record.web;

import com.one.record.lottery.LotteryOperationsHealthAcknowledgeRequest;
import com.one.record.lottery.LotteryOperationsHealthSummary;
import com.one.record.service.ILotteryOperationsService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("lottery/operations")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class LotteryOperationsController {

    private final ILotteryOperationsService service;

    @GetMapping("health")
    @Operation(summary = "查询彩票运营健康评分", description = "聚合 provider 新鲜度、同步、数据质量、票据核奖、决策复盘和导出留证状态")
    public LotteryOperationsHealthSummary health() {
        return service.health();
    }

    @PostMapping("health/acknowledge")
    @Operation(summary = "确认彩票运营健康提醒", description = "记录人工确认健康评分或单个 contributor 的审计事件")
    public LotteryOperationsHealthSummary acknowledgeHealth(@RequestBody(required = false) LotteryOperationsHealthAcknowledgeRequest request) {
        return service.acknowledgeHealth(request);
    }
}
