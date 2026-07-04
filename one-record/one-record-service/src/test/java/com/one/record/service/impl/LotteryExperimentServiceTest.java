package com.one.record.service.impl;

import com.one.record.lottery.LotteryExperimentRunRequest;
import com.one.record.lottery.LotteryExperimentUpdateRequest;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryStrategyExperiment;
import com.one.record.repository.LotteryStrategyExperimentRepository;
import com.one.record.service.ILotteryTrainingService;
import com.one.record.training.LotteryLatestPrediction;
import com.one.record.training.LotteryPredictionCandidate;
import com.one.record.training.LotteryTrainingReport;
import com.one.record.training.PredictionRuleConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryExperimentServiceTest {

    private LotteryStrategyExperimentRepository repository;

    private ILotteryTrainingService trainingService;

    private LotteryExperimentService service;

    @BeforeEach
    void setUp() {
        repository = mock(LotteryStrategyExperimentRepository.class);
        trainingService = mock(ILotteryTrainingService.class);
        service = new LotteryExperimentService(repository, trainingService);
    }

    @Test
    void runExperimentPersistsNormalizedReport() {
        when(trainingService.train(30, "standard")).thenReturn(report());
        when(repository.save(any(LotteryStrategyExperiment.class))).thenAnswer(invocation -> {
            LotteryStrategyExperiment experiment = invocation.getArgument(0);
            experiment.setId("exp-1");
            return experiment;
        });

        LotteryStrategyExperiment experiment = service.runExperiment(LotteryExperimentRunRequest.builder()
                .strategyName("  近期平衡试验  ")
                .replayWindow(-1)
                .scale("unknown")
                .inputSource(" manual ")
                .tags(List.of(" 稳健 ", "稳健", ""))
                .notes(" note ")
                .build());

        assertThat(experiment.getId()).isEqualTo("exp-1");
        assertThat(experiment.getStrategyName()).isEqualTo("近期平衡试验");
        assertThat(experiment.getReplayWindow()).isEqualTo(30);
        assertThat(experiment.getScale()).isEqualTo("standard");
        assertThat(experiment.getInputSource()).isEqualTo("manual");
        assertThat(experiment.getTags()).containsExactly("稳健");
        assertThat(experiment.getNotes()).isEqualTo("note");
        assertThat(experiment.getBestRule().getName()).isEqualTo("规则 A");
        assertThat(experiment.getScoreDistribution()).containsEntry("规则 A", 88);
        assertThat(experiment.getGeneratedCandidates()).hasSize(1);
        assertThat(experiment.getAuditMetadata().getAction()).isEqualTo("experiment-run");
        assertThat(experiment.getCreatedAt()).isNotNull();

        verify(trainingService).train(30, "standard");
        verify(repository).save(any(LotteryStrategyExperiment.class));
    }

    @Test
    void experimentsFiltersAndPagesRecords() {
        when(repository.findAll(any(Sort.class))).thenReturn(List.of(
                experiment("exp-1", "近期平衡", "稳健", 100L),
                experiment("exp-2", "蓝球探索", "激进", 200L),
                experiment("exp-3", "近期平衡深度", "稳健", 300L)
        ));

        LotteryPageResponse<LotteryStrategyExperiment> page = service.experiments(0, 1, "平衡", "稳健", 50L, 350L);

        assertThat(page.getTotal()).isEqualTo(2);
        assertThat(page.getItems()).extracting("id").containsExactly("exp-3");
        assertThat(page.getHasNext()).isTrue();
    }

    @Test
    void detailAndUpdateNotesUseRepository() {
        LotteryStrategyExperiment existing = experiment("exp-1", "近期平衡", "稳健", 100L);
        when(repository.findById("exp-1")).thenReturn(Optional.of(existing));
        when(repository.save(any(LotteryStrategyExperiment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LotteryStrategyExperiment updated = service.updateNotes("exp-1", LotteryExperimentUpdateRequest.builder()
                .tags(List.of("复盘", " 稳健 "))
                .notes("  updated  ")
                .build());

        assertThat(service.detail("exp-1")).isSameAs(existing);
        assertThat(updated.getTags()).containsExactly("复盘", "稳健");
        assertThat(updated.getNotes()).isEqualTo("updated");
        assertThat(updated.getAuditMetadata().getAction()).isEqualTo("experiment-update");
        assertThat(updated.getUpdatedAt()).isNotNull();
    }

    private static LotteryTrainingReport report() {
        PredictionRuleConfig config = PredictionRuleConfig.defaultConfig();
        config.setName("规则 A");
        LotteryTrainingReport.TrainingSummary summary = new LotteryTrainingReport.TrainingSummary();
        summary.setAverageScore(12.4);
        LotteryTrainingReport.TrainingResult result = new LotteryTrainingReport.TrainingResult();
        result.setConfig(config);
        result.setSummary(summary);
        result.setRankScore(88);
        LotteryPredictionCandidate candidate = new LotteryPredictionCandidate();
        candidate.setTitle("候选 A");
        candidate.setRedNumbers(List.of("01", "02", "03", "04", "05", "06"));
        candidate.setBlueNumber("07");
        LotteryLatestPrediction prediction = new LotteryLatestPrediction();
        prediction.setTitle("实验预测");
        prediction.setCandidates(new ArrayList<>(List.of(candidate)));
        LotteryTrainingReport report = new LotteryTrainingReport();
        report.setBest(result);
        report.setCandidates(List.of(result));
        report.setLatestPrediction(prediction);
        return report;
    }

    private static LotteryStrategyExperiment experiment(String id, String strategyName, String tag, long createdAt) {
        return LotteryStrategyExperiment.builder()
                .id(id)
                .strategyName(strategyName)
                .tags(List.of(tag))
                .createdAt(createdAt)
                .build();
    }
}
