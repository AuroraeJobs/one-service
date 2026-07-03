package com.one.record.web;

import com.one.record.model.LotteryPredictionRuleRecord;
import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.service.ILotteryTrainingService;
import com.one.record.training.LotteryActualRecord;
import com.one.record.training.LotteryReplayMetrics;
import com.one.record.training.LotteryRuleComparison;
import com.one.record.training.LotteryTrainingRequest;
import com.one.record.training.LotteryTrainingStatus;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("lottery/predictions")
@AllArgsConstructor
public class LotteryPredictionController {

    private final ILotteryTrainingService service;

    @GetMapping
    @Operation(summary = "查询彩票预测历史", description = "查询最近保存的彩票预测快照")
    public List<LotteryPredictionSnapshot> history(@RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit) {
        return service.predictionHistory(limit);
    }

    @GetMapping("rules")
    @Operation(summary = "查询彩票预测规则版本", description = "查询最近保存的彩票预测规则版本")
    public List<LotteryPredictionRuleRecord> rules(@RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit) {
        return service.predictionRules(limit);
    }

    @GetMapping("rules/compare")
    @Operation(summary = "比较彩票预测规则", description = "查询最近规则版本并返回当前排名最高的规则")
    public LotteryRuleComparison compareRules(@RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit) {
        return service.comparePredictionRules(limit);
    }

    @GetMapping("replay-metrics")
    @Operation(summary = "查询彩票预测回放指标", description = "基于最近训练报告时间线按历史窗口聚合回放指标")
    public LotteryReplayMetrics replayMetrics(@RequestParam(value = "window", required = false, defaultValue = "30") Integer window) {
        return service.replayMetrics(window);
    }

    @GetMapping("{id}")
    @Operation(summary = "查询彩票预测详情", description = "按快照 ID 查询预测详情、候选号码和命中结果")
    public LotteryPredictionSnapshot detail(@PathVariable("id") String id) {
        return service.predictionDetail(id);
    }

    @PostMapping("{id}/actual")
    @Operation(summary = "附加预测实际开奖结果", description = "按快照 ID 附加实际开奖结果并重算命中结果")
    public LotteryPredictionSnapshot attachActual(@PathVariable("id") String id,
                                                  @RequestBody LotteryActualRecord record) {
        return service.attachPredictionActual(id, record);
    }

    @PostMapping("train")
    @Operation(summary = "启动彩票预测训练", description = "在预测命名空间启动训练任务；兼容 lottery/training/start")
    public LotteryTrainingStatus train(@RequestBody LotteryTrainingRequest request) {
        return service.startTraining(request.getReplayCount(), request.getScale());
    }
}
