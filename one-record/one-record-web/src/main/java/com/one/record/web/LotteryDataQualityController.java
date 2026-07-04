package com.one.record.web;

import com.one.record.lottery.LotteryDataQualityReport;
import com.one.record.lottery.LotteryDataQualityRepairRequest;
import com.one.record.lottery.LotteryDataQualityRepairResult;
import com.one.record.service.ILotteryDataQualityService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    @PostMapping("repair/missing-issues/dry-run")
    @Operation(summary = "预览缺失期号修复", description = "从 provider 重新拉取记录并返回可修复缺失期号，不写入数据")
    public LotteryDataQualityRepairResult dryRunMissingIssuesRepair(@RequestBody(required = false) LotteryDataQualityRepairRequest request) {
        return service.dryRunMissingIssuesRepair(request);
    }

    @PostMapping("repair/missing-issues/confirm")
    @Operation(summary = "确认缺失期号修复", description = "仅写入 provider 能证明存在的缺失期号，并重新整理开奖记录 line 顺序")
    public LotteryDataQualityRepairResult confirmMissingIssuesRepair(@RequestBody(required = false) LotteryDataQualityRepairRequest request) {
        return service.confirmMissingIssuesRepair(request);
    }
}
