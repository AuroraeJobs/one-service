package com.one.record.web;

import com.one.record.lottery.LotteryWorkbenchDailyRunResult;
import com.one.record.lottery.LotteryWorkbenchSummary;
import com.one.record.lottery.LotteryDailyState;
import com.one.record.service.ILotteryWorkbenchService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("lottery/workbench")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class LotteryWorkbenchController {

    private final ILotteryWorkbenchService service;

    @GetMapping("summary")
    @Operation(summary = "查询彩票工作台摘要", description = "聚合最新开奖、同步、数据质量、预测、票据和收益状态")
    public LotteryWorkbenchSummary summary() {
        return service.summary();
    }

    @GetMapping("daily-state")
    @Operation(summary = "查询彩票日常状态", description = "返回当前期同步、预测、票据、核奖和质检状态")
    public LotteryDailyState dailyState() {
        return service.dailyState();
    }

    @PostMapping("daily-run")
    @Operation(summary = "执行彩票日常流程", description = "按顺序执行同步、预测回填、最新核奖和统计刷新，并返回每一步状态")
    public LotteryWorkbenchDailyRunResult dailyRun() {
        log.info("Running lottery workbench daily workflow");
        return service.dailyRun();
    }
}
