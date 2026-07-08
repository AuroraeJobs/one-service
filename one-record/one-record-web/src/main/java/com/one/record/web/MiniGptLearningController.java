package com.one.record.web;

import com.one.record.ai.MiniGptDashboard;
import com.one.record.ai.MiniGptEnvironmentCheck;
import com.one.record.ai.MiniGptCorpusInsight;
import com.one.record.ai.MiniGptGenerationRequest;
import com.one.record.ai.MiniGptGenerationResult;
import com.one.record.ai.MiniGptLotteryCorpusExport;
import com.one.record.ai.MiniGptRunNoteRequest;
import com.one.record.ai.MiniGptTrainingRequest;
import com.one.record.ai.MiniGptTrainingStatus;
import com.one.record.model.MiniGptRunRecord;
import com.one.record.model.MiniGptTrainingLogRecord;
import com.one.record.service.IMiniGptLearningService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("ai/minigpt")
@AllArgsConstructor
public class MiniGptLearningController {

    private final IMiniGptLearningService service;

    @GetMapping("dashboard")
    public MiniGptDashboard dashboard(@RequestParam(name = "runName", required = false) String runName,
                                      @RequestParam(name = "runLimit", required = false) Integer runLimit,
                                      @RequestParam(name = "logLimit", required = false) Integer logLimit) {
        return service.dashboard(runName, runLimit, logLimit);
    }

    @GetMapping("runs")
    public List<MiniGptRunRecord> runs(@RequestParam(name = "limit", required = false) Integer limit) {
        return service.runs(limit);
    }

    @GetMapping("runs/latest")
    public MiniGptRunRecord latestRun() {
        return service.latestRun();
    }

    @GetMapping("logs")
    public List<MiniGptTrainingLogRecord> logs(@RequestParam(name = "runName", required = false) String runName,
                                               @RequestParam(name = "limit", required = false) Integer limit) {
        return service.logs(runName, limit);
    }

    @PostMapping("training/start")
    public MiniGptTrainingStatus startTraining(@RequestBody(required = false) MiniGptTrainingRequest request) {
        return service.startTraining(request);
    }

    @GetMapping("training/status")
    public MiniGptTrainingStatus trainingStatus() {
        return service.trainingStatus();
    }

    @PostMapping("training/cancel")
    public MiniGptTrainingStatus cancelTraining() {
        return service.cancelTraining();
    }

    @GetMapping("environment")
    public MiniGptEnvironmentCheck environment() {
        return service.environment();
    }

    @PostMapping("corpus/lottery/export")
    public MiniGptLotteryCorpusExport exportLotteryCorpus(@RequestParam(name = "format", required = false) String format,
                                                          @RequestParam(name = "limit", required = false) Integer limit) {
        return service.exportLotteryCorpus(format, limit);
    }

    @GetMapping("corpus")
    public MiniGptCorpusInsight corpusInsight(@RequestParam(name = "data", required = false) String data,
                                              @RequestParam(name = "sample", required = false) String sample,
                                              @RequestParam(name = "tokenLimit", required = false) Integer tokenLimit) {
        return service.corpusInsight(data, sample, tokenLimit);
    }

    @PostMapping("generate")
    public MiniGptGenerationResult generate(@RequestBody(required = false) MiniGptGenerationRequest request) {
        return service.generate(request);
    }

    @PatchMapping("runs/{runName}/notes")
    public MiniGptRunRecord updateRunNotes(@PathVariable("runName") String runName,
                                           @RequestBody(required = false) MiniGptRunNoteRequest request) {
        return service.updateRunNotes(runName, request);
    }
}
