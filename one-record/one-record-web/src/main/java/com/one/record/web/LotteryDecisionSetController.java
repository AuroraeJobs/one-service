package com.one.record.web;

import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryDecisionSet;
import com.one.record.service.ILotteryDecisionSetService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("lottery/decision-sets")
@AllArgsConstructor
public class LotteryDecisionSetController {

    private final ILotteryDecisionSetService service;

    @GetMapping
    @Operation(summary = "分页查询彩票决策集", description = "查询默认用户保存的预测决策集，默认不包含归档记录")
    public LotteryPageResponse<LotteryDecisionSet> decisionSets(
            @RequestParam(value = "includeArchived", required = false, defaultValue = "false") Boolean includeArchived,
            @RequestParam(value = "page", required = false, defaultValue = "1") Integer page,
            @RequestParam(value = "pageSize", required = false, defaultValue = "20") Integer pageSize) {
        return service.decisionSets(includeArchived, page, pageSize);
    }

    @PostMapping
    @Operation(summary = "保存彩票决策集", description = "保存预测决策板中选中的候选号码、规则证据和转票状态")
    public LotteryDecisionSet createDecisionSet(@RequestBody LotteryDecisionSet decisionSet) {
        return service.createDecisionSet(decisionSet);
    }

    @PutMapping("{id}")
    @Operation(summary = "更新彩票决策集", description = "更新已保存的彩票决策集内容和转票状态")
    public LotteryDecisionSet updateDecisionSet(@PathVariable("id") String id,
                                                @RequestBody LotteryDecisionSet decisionSet) {
        return service.updateDecisionSet(id, decisionSet);
    }

    @PatchMapping("{id}/archive")
    @Operation(summary = "归档彩票决策集", description = "将决策集标记为归档，列表默认不再展示")
    public LotteryDecisionSet archiveDecisionSet(@PathVariable("id") String id) {
        return service.archiveDecisionSet(id);
    }
}
