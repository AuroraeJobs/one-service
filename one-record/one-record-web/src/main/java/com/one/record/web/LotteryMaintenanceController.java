package com.one.record.web;

import com.one.record.lottery.LotteryMaintenanceSummary;
import com.one.record.service.ILotteryMaintenanceService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("lottery/maintenance")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class LotteryMaintenanceController {

    private final ILotteryMaintenanceService service;

    @GetMapping("summary")
    @Operation(summary = "查询彩票维护摘要", description = "返回日志、历史记录和回测集合的容量与过期预览")
    public LotteryMaintenanceSummary summary() {
        return service.summary();
    }

    @PostMapping("cleanup/dry-run")
    @Operation(summary = "预览彩票维护清理", description = "仅返回清理影响预估，不修改任何数据")
    public LotteryMaintenanceSummary cleanupDryRun() {
        return service.cleanupDryRun();
    }
}
