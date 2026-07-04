package com.one.record.web;

import com.one.record.lottery.LotteryBudgetStatus;
import com.one.record.service.ILotteryBudgetService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("lottery/budget")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class LotteryBudgetController {

    private final ILotteryBudgetService service;

    @GetMapping("status")
    @Operation(summary = "查询彩票预算治理状态", description = "返回周/月预算、期次票据数量和非阻断式风险提示")
    public LotteryBudgetStatus status() {
        return service.status();
    }
}
