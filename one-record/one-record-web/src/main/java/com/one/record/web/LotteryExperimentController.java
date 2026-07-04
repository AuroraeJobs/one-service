package com.one.record.web;

import com.one.record.lottery.LotteryExperimentRunRequest;
import com.one.record.lottery.LotteryExperimentUpdateRequest;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryStrategyExperiment;
import com.one.record.service.ILotteryExperimentService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("lottery/experiments")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class LotteryExperimentController {

    private final ILotteryExperimentService service;

    @PostMapping("run")
    @Operation(summary = "运行彩票策略实验", description = "显式运行一次策略实验并保存可复盘记录")
    public LotteryStrategyExperiment run(@RequestBody(required = false) LotteryExperimentRunRequest request) {
        return service.runExperiment(request);
    }

    @GetMapping
    @Operation(summary = "分页查询彩票策略实验", description = "按策略名称、标签和创建时间筛选实验记录")
    public LotteryPageResponse<LotteryStrategyExperiment> experiments(
            @RequestParam(value = "page", required = false, defaultValue = "0") Integer page,
            @RequestParam(value = "pageSize", required = false, defaultValue = "20") Integer pageSize,
            @RequestParam(value = "strategyName", required = false) String strategyName,
            @RequestParam(value = "tag", required = false) String tag,
            @RequestParam(value = "createdStartAt", required = false) Long createdStartAt,
            @RequestParam(value = "createdEndAt", required = false) Long createdEndAt) {
        return service.experiments(page, pageSize, strategyName, tag, createdStartAt, createdEndAt);
    }

    @GetMapping("{id}")
    @Operation(summary = "查询彩票策略实验详情", description = "按实验 ID 查询参数、候选、分布和实验摘要")
    public LotteryStrategyExperiment detail(@PathVariable("id") String id) {
        return service.detail(id);
    }

    @PatchMapping("{id}")
    @Operation(summary = "更新彩票策略实验备注", description = "更新实验标签和备注")
    public LotteryStrategyExperiment updateNotes(@PathVariable("id") String id,
                                                 @RequestBody LotteryExperimentUpdateRequest request) {
        return service.updateNotes(id, request);
    }
}
