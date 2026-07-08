package com.one.record.web;

import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryRecommendationRollup;
import com.one.record.lottery.LotteryRecommendationStatusRequest;
import com.one.record.model.LotteryRecommendation;
import com.one.record.service.ILotteryRecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("lottery/recommendations")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class LotteryRecommendationController {

    private final ILotteryRecommendationService service;

    @GetMapping
    @Operation(summary = "查询彩票校准推荐", description = "查询推广、观察、暂停、退役等推荐生命周期记录")
    public LotteryPageResponse<LotteryRecommendation> recommendations(@RequestParam(name = "recommendationState", required = false) String recommendationState,
                                                                      @RequestParam(name = "page", required = false, defaultValue = "1") Integer page,
                                                                      @RequestParam(name = "pageSize", required = false, defaultValue = "20") Integer pageSize) {
        return service.recommendations(recommendationState, page, pageSize);
    }

    @GetMapping("{id}")
    @Operation(summary = "查询彩票校准推荐详情", description = "按 ID 查询推荐证据、原因和生命周期状态")
    public LotteryRecommendation detail(@PathVariable("id") String id) {
        return service.detail(id);
    }

    @GetMapping("rollup")
    @Operation(summary = "查询彩票推荐生命周期汇总", description = "按窗口汇总推荐状态、生命周期状态、目标类型和状态转移")
    public LotteryRecommendationRollup rollup(@RequestParam(name = "window", required = false, defaultValue = "recent30") String window,
                                              @RequestParam(name = "limit", required = false) Integer limit) {
        return service.rollup(window, limit);
    }

    @PostMapping("refresh")
    @Operation(summary = "刷新彩票校准推荐", description = "从最新归因结果刷新规则、组合、沙盘和期号推荐")
    public LotteryPageResponse<LotteryRecommendation> refresh(@RequestParam(name = "limit", required = false, defaultValue = "12") Integer limit) {
        log.info("Refreshing lottery recommendations: limit={}", limit);
        return service.refresh(limit);
    }

    @PatchMapping("{id}/status")
    @Operation(summary = "更新彩票推荐生命周期", description = "将推荐标记为 OPEN、APPLIED、SNOOZED 或 ARCHIVED")
    public LotteryRecommendation updateStatus(@PathVariable("id") String id, @RequestBody LotteryRecommendationStatusRequest request) {
        log.info("Updating lottery recommendation status: id={}, request={}", id, request);
        return service.updateStatus(id, request);
    }
}
