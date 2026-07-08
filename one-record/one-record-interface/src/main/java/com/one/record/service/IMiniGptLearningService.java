package com.one.record.service;

import com.one.record.ai.MiniGptDashboard;
import com.one.record.ai.MiniGptEnvironmentCheck;
import com.one.record.ai.MiniGptGenerationRequest;
import com.one.record.ai.MiniGptGenerationResult;
import com.one.record.ai.MiniGptLotteryCorpusExport;
import com.one.record.ai.MiniGptCorpusInsight;
import com.one.record.ai.MiniGptRunNoteRequest;
import com.one.record.ai.MiniGptTrainingRequest;
import com.one.record.ai.MiniGptTrainingStatus;
import com.one.record.model.MiniGptRunRecord;
import com.one.record.model.MiniGptTrainingLogRecord;

import java.util.List;

public interface IMiniGptLearningService {

    MiniGptDashboard dashboard(String runName, Integer runLimit, Integer logLimit);

    List<MiniGptRunRecord> runs(Integer limit);

    MiniGptRunRecord latestRun();

    List<MiniGptTrainingLogRecord> logs(String runName, Integer limit);

    MiniGptTrainingStatus startTraining(MiniGptTrainingRequest request);

    MiniGptTrainingStatus trainingStatus();

    MiniGptTrainingStatus cancelTraining();

    MiniGptEnvironmentCheck environment();

    MiniGptLotteryCorpusExport exportLotteryCorpus(String format, Integer limit);

    MiniGptCorpusInsight corpusInsight(String data, String sample, Integer tokenLimit);

    MiniGptGenerationResult generate(MiniGptGenerationRequest request);

    MiniGptRunRecord updateRunNotes(String runName, MiniGptRunNoteRequest request);
}
