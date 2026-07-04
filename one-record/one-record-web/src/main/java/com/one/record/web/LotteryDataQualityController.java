package com.one.record.web;

import com.one.record.lottery.LotteryDataQualityReport;
import com.one.record.service.ILotteryDataQualityService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("lottery/data-quality")
@AllArgsConstructor
public class LotteryDataQualityController {

    private final ILotteryDataQualityService service;

    @GetMapping
    @Operation(summary = "查询彩票数据质量报告", description = "检查缺失期号、重复期号、号码格式异常和未来日期")
    public LotteryDataQualityReport report() {
        return service.report();
    }
}
