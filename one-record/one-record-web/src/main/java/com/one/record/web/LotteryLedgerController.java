package com.one.record.web;

import com.one.record.lottery.LotteryLedgerSummary;
import com.one.record.service.ILotteryLedgerService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
