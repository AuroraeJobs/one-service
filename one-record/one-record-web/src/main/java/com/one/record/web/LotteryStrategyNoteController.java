package com.one.record.web;

import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryStrategyNoteAttachRequest;
import com.one.record.model.LotteryStrategyNote;
import com.one.record.service.ILotteryStrategyNoteService;
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
@RequestMapping("lottery/strategy-notes")
@AllArgsConstructor
public class LotteryStrategyNoteController {

    private final ILotteryStrategyNoteService service;

    @GetMapping
    @Operation(summary = "分页查询彩票策略笔记", description = "查询规则假设、预期表现和已挂载证据，默认不包含归档记录")
    public LotteryPageResponse<LotteryStrategyNote> notes(
            @RequestParam(value = "includeArchived", required = false, defaultValue = "false") Boolean includeArchived,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", required = false, defaultValue = "1") Integer page,
            @RequestParam(value = "pageSize", required = false, defaultValue = "20") Integer pageSize) {
        return service.notes(includeArchived, status, page, pageSize);
    }

    @PostMapping
    @Operation(summary = "创建彩票策略笔记", description = "保存规则假设、预期表现、标签和初始证据")
    public LotteryStrategyNote create(@RequestBody LotteryStrategyNote note) {
        return service.create(note);
    }

    @PutMapping("{id}")
    @Operation(summary = "更新彩票策略笔记", description = "更新策略假设、状态、标签和证据列表")
    public LotteryStrategyNote update(@PathVariable("id") String id, @RequestBody LotteryStrategyNote note) {
        return service.update(id, note);
    }

    @PatchMapping("{id}/archive")
    @Operation(summary = "归档彩票策略笔记", description = "将策略笔记标记为归档")
    public LotteryStrategyNote archive(@PathVariable("id") String id) {
        return service.archive(id);
    }

    @PostMapping("{id}/evidence")
    @Operation(summary = "挂载彩票策略证据", description = "将预测、回测、实验、账本表现或保存决策结果挂载到策略笔记")
    public LotteryStrategyNote attachEvidence(@PathVariable("id") String id,
                                              @RequestBody(required = false) LotteryStrategyNoteAttachRequest request) {
        return service.attachEvidence(id, request);
    }
}
