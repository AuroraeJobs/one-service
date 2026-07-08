package com.one.record.web;

import com.one.record.lottery.LotteryOutcomeAttribution;
import com.one.record.lottery.LotteryOutcomeAttributionRollup;
import com.one.record.service.ILotteryOutcomeAttributionService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("lottery/outcomes")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class LotteryOutcomeAttributionController {

    private final ILotteryOutcomeAttributionService service;

    @GetMapping
    @Operation(summary = "查询彩票开奖结果归因", description = "按最近期号返回票据、决策、票包、组合和沙盘的归因摘要")
    public List<LotteryOutcomeAttribution> recent(@RequestParam(name = "limit", required = false, defaultValue = "12") Integer limit) {
        return service.recent(limit);
    }

    @GetMapping("rollup")
    @Operation(summary = "查询彩票归因聚合", description = "按窗口聚合期号、组合、规则、票包、沙盘和推荐生命周期归因")
    public LotteryOutcomeAttributionRollup rollup(@RequestParam(name = "window", required = false, defaultValue = "recent10") String window,
                                                  @RequestParam(name = "limit", required = false) Integer limit) {
        return service.rollup(window, limit);
    }

    @GetMapping("{issue}")
    @Operation(summary = "查询单期彩票归因", description = "按期号返回完整归因详情和校准状态")
    public LotteryOutcomeAttribution issue(@PathVariable("issue") String issue) {
        log.info("Loading lottery outcome attribution: issue={}", issue);
        return service.issue(issue);
    }
}
