package com.one.record.web;

import com.one.record.lottery.LotteryStatisticsSummary;
import com.one.record.service.ILotteryStatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("lottery/statistics")
@AllArgsConstructor
public class LotteryStatisticsController {

    private final ILotteryStatisticsService service;

    @GetMapping("summary")
    @Operation(summary = "查询彩票统计汇总", description = "返回开奖记录总览、红蓝球频率和基础结构分布")
    public LotteryStatisticsSummary summary() {
        return service.summary();
    }

    @GetMapping("frequency")
    @Operation(summary = "查询彩票号码频率", description = "返回红球和蓝球号码出现频率")
    public Map<String, List<LotteryStatisticsSummary.NumberFrequency>> frequency() {
        return service.frequency();
    }

    @GetMapping("distribution")
    @Operation(summary = "查询彩票结构分布", description = "返回红和值、奇数个数、大号个数和跨度分布")
    public Map<String, List<LotteryStatisticsSummary.DistributionItem>> distribution() {
        return service.distribution();
    }
}
