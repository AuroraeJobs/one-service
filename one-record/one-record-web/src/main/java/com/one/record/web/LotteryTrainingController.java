package com.one.record.web;

import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryTrainingReportRecord;
import com.one.record.service.ILotteryTrainingService;
import com.one.record.training.*;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("lottery/training")
@AllArgsConstructor
public class LotteryTrainingController {

    private final ILotteryTrainingService service;

    @PostMapping("run")
    public LotteryTrainingReport run(@RequestBody LotteryTrainingRequest request) {
        return service.train(request.getReplayCount(), request.getScale());
    }

    @PostMapping("start")
    public LotteryTrainingStatus start(@RequestBody LotteryTrainingRequest request) {
        return service.startTraining(request.getReplayCount(), request.getScale());
    }

    @GetMapping("status")
    public LotteryTrainingStatus status() {
        return service.trainingStatus();
    }

    @GetMapping("status/stream")
    public SseEmitter statusStream() {
        return service.streamStatus();
    }

    @PostMapping("cancel")
    public LotteryTrainingStatus cancel() {
        return service.cancelTraining();
    }

    @PostMapping("retry")
    public LotteryTrainingStatus retry() {
        return service.retryTraining();
    }

    @GetMapping("best")
    public PredictionRuleConfig best() {
        return service.bestRule();
    }

    @GetMapping("prediction/latest")
    public LotteryLatestPrediction latestPrediction() {
        return service.latestPrediction();
    }

    @GetMapping("actual/latest")
    public LotteryActualRecord latestActualRecord() {
        return service.latestActualRecord();
    }

    @PostMapping("actual/latest")
    public LotteryActualRecord saveLatestActualRecord(@RequestBody LotteryActualRecord record) {
        return service.saveLatestActualRecord(record);
    }

    @GetMapping("reports")
    public LotteryPageResponse<LotteryTrainingReportRecord> reports(
            @RequestParam(name = "page", defaultValue = "0") Integer page,
            @RequestParam(name = "pageSize", defaultValue = "20") Integer pageSize) {
        return service.trainingReportsPage(page, pageSize);
    }

    @GetMapping("reports/{id}")
    public LotteryTrainingReportRecord reportDetail(@PathVariable("id") String id) {
        return service.trainingReportDetail(id);
    }
}
