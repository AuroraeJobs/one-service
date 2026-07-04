package com.one.record.web;

import com.one.record.lottery.LotteryIssueLedger;
import com.one.record.lottery.LotteryLedgerSummary;
import com.one.record.lottery.LotteryMonthlyLedger;
import com.one.record.lottery.LotteryPerformanceLedger;
import com.one.record.service.ILotteryLedgerService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("lottery/ledger")
@AllArgsConstructor
public class LotteryLedgerController {

    private final ILotteryLedgerService service;

    @GetMapping("summary")
    @Operation(summary = "查询彩票账本汇总", description = "汇总彩票票据成本、奖金、净收益和 ROI")
    public LotteryLedgerSummary summary() {
        return service.summary();
    }

    @GetMapping("issues")
    @Operation(summary = "查询彩票期次账本", description = "按期次汇总彩票票据成本、奖金、净收益和 ROI")
    public List<LotteryIssueLedger> issues() {
        return service.issues();
    }

    @GetMapping("months")
    @Operation(summary = "查询彩票月度账本", description = "按票据创建月份汇总彩票成本、奖金、净收益和 ROI")
    public List<LotteryMonthlyLedger> months() {
        return service.months();
    }

    @GetMapping("performance")
    @Operation(summary = "查询彩票规则或来源表现", description = "按来源或预测规则汇总彩票成本、奖金、净收益、ROI 和命中率")
    public List<LotteryPerformanceLedger> performance(@RequestParam(name = "dimension", required = false) String dimension) {
        return service.performance(dimension);
    }
}
