package com.one.record.service.impl;

import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.model.LotteryPredictionRuleRecord;
import com.one.record.model.LotteryTrainingReportRecord;
import com.one.record.repository.LotteryPredictionRuleRepository;
import com.one.record.repository.LotteryPredictionSnapshotRepository;
import com.one.record.repository.LotteryTrainingReportRepository;
import com.one.record.training.LotteryActualRecord;
import com.one.record.training.LotteryLatestPrediction;
import com.one.record.training.LotteryPredictionCandidate;
import com.one.record.training.LotteryTrainingReport;
import com.one.record.training.PredictionRuleConfig;
import org.mockito.ArgumentCaptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryTrainingServiceTest {

    private LotteryPredictionSnapshotRepository predictionSnapshotRepository;

    private LotteryTrainingReportRepository trainingReportRepository;

    private LotteryPredictionRuleRepository predictionRuleRepository;

    private LotteryTrainingService service;

    @BeforeEach
    void setUp() {
        predictionSnapshotRepository = mock(LotteryPredictionSnapshotRepository.class);
        trainingReportRepository = mock(LotteryTrainingReportRepository.class);
        predictionRuleRepository = mock(LotteryPredictionRuleRepository.class);
        service = new LotteryTrainingService(mock(StringRedisTemplate.class), predictionSnapshotRepository,
                trainingReportRepository, predictionRuleRepository);
    }

    @Test
    void savePredictionSnapshotMapsLatestPrediction() {
        LotteryPredictionCandidate candidate = new LotteryPredictionCandidate();
        candidate.setTitle("候选");
        candidate.setRedNumbers(List.of("01", "02", "03", "04", "05", "06"));
        candidate.setBlueNumber("07");
        candidate.setScore(88);
        LotteryLatestPrediction prediction = new LotteryLatestPrediction();
        prediction.setTitle("综合推荐");
        prediction.setRedNumbers(List.of("01", "02", "03", "04", "05", "06"));
        prediction.setBlueNumber("07");
        prediction.setScore(99);
        prediction.setRuleId("rule-1");
        prediction.setRuleName("规则一");
        prediction.setBasedOnPeriod(2026001);
        prediction.setTargetPeriod(2026002);
        prediction.setReason("测试快照");
        prediction.setCandidates(List.of(candidate));
        when(predictionSnapshotRepository.save(org.mockito.ArgumentMatchers.any(LotteryPredictionSnapshot.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LotteryPredictionSnapshot snapshot = service.savePredictionSnapshot(prediction);

        assertThat(snapshot.getTitle()).isEqualTo("综合推荐");
        assertThat(snapshot.getRedNumbers()).containsExactly("01", "02", "03", "04", "05", "06");
        assertThat(snapshot.getBlueNumber()).isEqualTo("07");
        assertThat(snapshot.getRuleId()).isEqualTo("rule-1");
        assertThat(snapshot.getTargetPeriod()).isEqualTo(2026002);
        assertThat(snapshot.getCandidates()).hasSize(1);
        assertThat(snapshot.getCreatedAt()).isNotNull();
        assertThat(snapshot.getUpdatedAt()).isEqualTo(snapshot.getCreatedAt());
    }

    @Test
    void predictionHistoryCapsLimit() {
        when(predictionSnapshotRepository.findByOrderByCreatedAtDesc(org.mockito.ArgumentMatchers.any(Pageable.class)))
                .thenReturn(List.of());

        service.predictionHistory(500);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(predictionSnapshotRepository).findByOrderByCreatedAtDesc(pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(100);
    }

    @Test
    void attachPredictionActualScoresSnapshotAndCandidates() {
        LotteryPredictionCandidate candidate = new LotteryPredictionCandidate();
        candidate.setTitle("候选");
        candidate.setRedNumbers(List.of("01", "02", "03", "04", "05", "06"));
        candidate.setBlueNumber("08");
        LotteryPredictionSnapshot snapshot = LotteryPredictionSnapshot.builder()
                .id("snapshot-1")
                .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                .blueNumber("07")
                .candidates(List.of(candidate))
                .createdAt(100L)
                .updatedAt(100L)
                .build();
        LotteryActualRecord actual = new LotteryActualRecord();
        actual.setPeriod(2026002);
        actual.setRedNumbers(List.of("1", "02", "03", "09", "10", "11"));
        actual.setBlueNumber("7");
        when(predictionSnapshotRepository.findById("snapshot-1")).thenReturn(Optional.of(snapshot));
        when(predictionSnapshotRepository.save(org.mockito.ArgumentMatchers.any(LotteryPredictionSnapshot.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LotteryPredictionSnapshot result = service.attachPredictionActual("snapshot-1", actual);

        assertThat(result.getActualRecord().getRedNumbers()).containsExactly("01", "02", "03", "09", "10", "11");
        assertThat(result.getActualRecord().getBlueNumber()).isEqualTo("07");
        assertThat(result.getResult().getRedHits()).isEqualTo(3);
        assertThat(result.getResult().isBlueHit()).isTrue();
        assertThat(result.getCandidates().get(0).getResult().getRedHits()).isEqualTo(3);
        assertThat(result.getCandidates().get(0).getResult().isBlueHit()).isFalse();
        assertThat(result.getUpdatedAt()).isGreaterThan(100L);
    }

    @Test
    void saveTrainingReportRecordMapsReport() {
        LotteryTrainingReport.TrainingResult best = new LotteryTrainingReport.TrainingResult();
        LotteryLatestPrediction prediction = new LotteryLatestPrediction();
        prediction.setTitle("综合推荐");
        prediction.setBlueNumber("07");
        LotteryTrainingReport.TrainingTimelineItem timelineItem = new LotteryTrainingReport.TrainingTimelineItem();
        timelineItem.setPeriod(2026001);
        LotteryTrainingReport report = new LotteryTrainingReport();
        report.setReplayCount(30);
        report.setGeneration(2);
        report.setBest(best);
        report.setLatestPrediction(prediction);
        report.setCandidates(List.of(best));
        report.setTimeline(List.of(timelineItem));
        when(trainingReportRepository.save(org.mockito.ArgumentMatchers.any(LotteryTrainingReportRecord.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LotteryTrainingReportRecord record = service.saveTrainingReportRecord(report);

        assertThat(record.getReplayCount()).isEqualTo(30);
        assertThat(record.getGeneration()).isEqualTo(2);
        assertThat(record.getBest()).isSameAs(best);
        assertThat(record.getLatestPrediction().getBlueNumber()).isEqualTo("07");
        assertThat(record.getCandidates()).hasSize(1);
        assertThat(record.getTimeline()).hasSize(1);
        assertThat(record.getCreatedAt()).isNotNull();
        assertThat(record.getUpdatedAt()).isEqualTo(record.getCreatedAt());
    }

    @Test
    void savePredictionRuleRecordMapsLearnedRule() {
        PredictionRuleConfig config = PredictionRuleConfig.defaultConfig();
        LotteryTrainingReport.TrainingSummary summary = new LotteryTrainingReport.TrainingSummary();
        summary.setAverageScore(88.8);
        LotteryTrainingReport.TrainingResult result = new LotteryTrainingReport.TrainingResult();
        result.setSummary(summary);
        result.setRankScore(900);
        when(predictionRuleRepository.save(org.mockito.ArgumentMatchers.any(LotteryPredictionRuleRecord.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LotteryPredictionRuleRecord record = service.savePredictionRuleRecord(config, result, 3, 30, true);

        assertThat(record.getRuleId()).isEqualTo("default");
        assertThat(record.getRuleName()).isEqualTo("默认综合规则");
        assertThat(record.getGeneration()).isEqualTo(3);
        assertThat(record.getReplayCount()).isEqualTo(30);
        assertThat(record.getRankScore()).isEqualTo(900);
        assertThat(record.getSummary().getAverageScore()).isEqualTo(88.8);
        assertThat(record.getLearned()).isTrue();
        assertThat(record.getCreatedAt()).isNotNull();
    }

    @Test
    void comparePredictionRulesReturnsBestByRankScore() {
        when(predictionRuleRepository.findByOrderByCreatedAtDesc(org.mockito.ArgumentMatchers.any(Pageable.class)))
                .thenReturn(List.of(
                        LotteryPredictionRuleRecord.builder().ruleId("a").ruleName("A").rankScore(10).build(),
                        LotteryPredictionRuleRecord.builder().ruleId("b").ruleName("B").rankScore(20).build()
                ));

        var comparison = service.comparePredictionRules(20);

        assertThat(comparison.getRules()).hasSize(2);
        assertThat(comparison.getBestRuleId()).isEqualTo("b");
        assertThat(comparison.getBestRuleName()).isEqualTo("B");
        assertThat(comparison.getBestRankScore()).isEqualTo(20);
        assertThat(comparison.getGeneratedAt()).isNotNull();
    }
}
