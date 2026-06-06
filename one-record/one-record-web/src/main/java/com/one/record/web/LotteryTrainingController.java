package com.one.record.web;

import lombok.AllArgsConstructor;
import com.one.record.service.ILotteryTrainingService;
import com.one.record.training.LotteryActualRecord;
import com.one.record.training.LotteryLatestPrediction;
import com.one.record.training.LotteryTrainingRequest;
import com.one.record.training.LotteryTrainingReport;
import com.one.record.training.LotteryTrainingStatus;
import com.one.record.training.PredictionRuleConfig;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
