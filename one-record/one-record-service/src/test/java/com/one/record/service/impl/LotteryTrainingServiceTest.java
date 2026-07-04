package com.one.record.service.impl;

import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.model.LotteryPredictionRuleRecord;
import com.one.record.model.LotteryBacktestReport;
import com.one.record.model.LotteryTrainingReportRecord;
import com.one.record.repository.LotteryBacktestReportRepository;
import com.one.record.repository.LotteryPredictionRuleRepository;
import com.one.record.repository.LotteryPredictionSnapshotRepository;
import com.one.record.repository.LotteryTrainingReportRepository;
import com.one.record.response.Record;
import com.one.record.service.IRecordService;
import com.one.record.training.LotteryActualRecord;
import com.one.record.training.LotteryLatestPrediction;
import com.one.record.training.LotteryPredictionCandidate;
import com.one.record.training.LotteryPredictionResult;
import com.one.record.training.LotteryReplayMetrics;
import com.one.record.training.LotteryTrainingReport;
import com.one.record.training.PredictionRuleConfig;
import org.mockito.ArgumentCaptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryTrainingServiceTest {

    private LotteryPredictionSnapshotRepository predictionSnapshotRepository;

    private LotteryTrainingReportRepository trainingReportRepository;

    private LotteryPredictionRuleRepository predictionRuleRepository;

    private LotteryBacktestReportRepository backtestReportRepository;

    private IRecordService recordService;

    private LotteryTrainingService service;

    @BeforeEach
    void setUp() {
        predictionSnapshotRepository = mock(LotteryPredictionSnapshotRepository.class);
        trainingReportRepository = mock(LotteryTrainingReportRepository.class);
        predictionRuleRepository = mock(LotteryPredictionRuleRepository.class);
        backtestReportRepository = mock(LotteryBacktestReportRepository.class);
        recordService = mock(IRecordService.class);
        service = new LotteryTrainingService(mock(StringRedisTemplate.class), predictionSnapshotRepository,
                trainingReportRepository, predictionRuleRepository, backtestReportRepository, recordService);
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
    void predictionHistoryPageFiltersAndPaginates() {
        LotteryPredictionResult won = new LotteryPredictionResult();
        won.setPrizeName("五等奖");
        LotteryPredictionResult missed = new LotteryPredictionResult();
        missed.setPrizeName("未中奖");
        when(predictionSnapshotRepository.findAll(org.mockito.ArgumentMatchers.any(Sort.class))).thenReturn(List.of(
                LotteryPredictionSnapshot.builder()
                        .id("pending")
                        .targetPeriod(2026002)
                        .ruleId("rule-a")
                        .ruleName("平衡规则")
                        .build(),
                LotteryPredictionSnapshot.builder()
                        .id("won")
                        .targetPeriod(2026002)
                        .ruleId("rule-a")
                        .ruleName("平衡规则")
                        .result(won)
                        .build(),
                LotteryPredictionSnapshot.builder()
                        .id("missed")
                        .targetPeriod(2026003)
                        .ruleId("rule-b")
                        .ruleName("遗漏规则")
                        .result(missed)
                        .build()
        ));

        var page = service.predictionHistoryPage(0, 1, "won", 2026002, "rule-a", "平衡");

        assertThat(page.getItems()).extracting(LotteryPredictionSnapshot::getId).containsExactly("won");
        assertThat(page.getPage()).isZero();
        assertThat(page.getPageSize()).isEqualTo(1);
        assertThat(page.getTotal()).isEqualTo(1);
        assertThat(page.getHasNext()).isFalse();
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
    void attachLatestActualScoresMatchingSnapshots() {
        Record latest = new Record();
        latest.setCode("2026002");
        latest.setRed("01,02,03,09,10,11");
        latest.setBlue("07");
        LotteryPredictionSnapshot snapshot = LotteryPredictionSnapshot.builder()
                .id("snapshot-1")
                .targetPeriod(2026002)
                .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                .blueNumber("07")
                .createdAt(100L)
                .updatedAt(100L)
                .build();
        when(recordService.findLast()).thenReturn(latest);
        when(predictionSnapshotRepository.findByTargetPeriodOrderByCreatedAtDesc(2026002)).thenReturn(List.of(snapshot));
        when(predictionSnapshotRepository.findById("snapshot-1")).thenReturn(Optional.of(snapshot));
        when(predictionSnapshotRepository.save(org.mockito.ArgumentMatchers.any(LotteryPredictionSnapshot.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        List<LotteryPredictionSnapshot> updated = service.attachLatestActualToMatchingPredictions();

        assertThat(updated).hasSize(1);
        assertThat(updated.get(0).getActualRecord().getPeriod()).isEqualTo(2026002);
        assertThat(updated.get(0).getResult().getRedHits()).isEqualTo(3);
        assertThat(updated.get(0).getResult().isBlueHit()).isTrue();
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
        when(backtestReportRepository.findAll(any(Sort.class))).thenReturn(List.of(
                LotteryBacktestReport.builder()
                        .id("bt-b")
                        .strategyName("B")
                        .presetWindow("latest-30")
                        .replayCount(30)
                        .stabilityScore(86)
                        .createdAt(200L)
                        .build()
        ));

        var comparison = service.comparePredictionRules(20);

        assertThat(comparison.getRules()).hasSize(2);
        assertThat(comparison.getBestRuleId()).isEqualTo("b");
        assertThat(comparison.getBestRuleName()).isEqualTo("B");
        assertThat(comparison.getBestRankScore()).isEqualTo(20);
        assertThat(comparison.getBestBacktestSummary().getBacktestId()).isEqualTo("bt-b");
        assertThat(comparison.getRules().get(1).getBacktestSummary().getStabilityScore()).isEqualTo(86);
        assertThat(comparison.getGeneratedAt()).isNotNull();
    }

    @Test
    void trainingStatusDefaultsToIdleRetryParams() {
        var status = service.trainingStatus();

        assertThat(status.isRunning()).isFalse();
        assertThat(status.isFailed()).isFalse();
        assertThat(status.isCancelled()).isFalse();
        assertThat(status.getReplayCount()).isEqualTo(30);
        assertThat(status.getScale()).isEqualTo("standard");
        assertThat(status.getUpdatedAt()).isNotNull();
    }

    @Test
    void cancelTrainingWithoutRunningKeepsIdleState() {
        var status = service.cancelTraining();

        assertThat(status.isRunning()).isFalse();
        assertThat(status.isCancelled()).isFalse();
        assertThat(status.getMessage()).isEqualTo("当前没有运行中的训练任务");
        assertThat(status.getUpdatedAt()).isNotNull();
    }

    @Test
    void replayMetricsAggregatesLatestReportTimelineByWindow() {
        LotteryTrainingReport.TrainingTimelineItem first = timeline(2026001, 90, 2, false, "未中奖");
        LotteryTrainingReport.TrainingTimelineItem second = timeline(2026002, 120, 3, true, "五等奖");
        LotteryTrainingReport.TrainingTimelineItem third = timeline(2026003, 150, 4, false, "四等奖");
        when(trainingReportRepository.findByOrderByCreatedAtDesc(org.mockito.ArgumentMatchers.any(Pageable.class)))
                .thenReturn(List.of(LotteryTrainingReportRecord.builder()
                        .replayCount(30)
                        .generation(5)
                        .timeline(List.of(first, second, third))
                        .build()));

        LotteryReplayMetrics metrics = service.replayMetrics(2);

        assertThat(metrics.getRequestedWindow()).isEqualTo(2);
        assertThat(metrics.getActualWindow()).isEqualTo(2);
        assertThat(metrics.getReportReplayCount()).isEqualTo(30);
        assertThat(metrics.getGeneration()).isEqualTo(5);
        assertThat(metrics.getAverageScore()).isEqualTo(135.0);
        assertThat(metrics.getAverageRedHits()).isEqualTo(3.5);
        assertThat(metrics.getBlueHitRate()).isEqualTo(50);
        assertThat(metrics.getBestScore()).isEqualTo(150);
        assertThat(metrics.getPrizeDistribution()).containsEntry("五等奖", 1).containsEntry("四等奖", 1);
    }

    @Test
    void replayMetricsReturnsEmptyMetricsWhenNoReportExists() {
        when(trainingReportRepository.findByOrderByCreatedAtDesc(org.mockito.ArgumentMatchers.any(Pageable.class)))
                .thenReturn(List.of());

        LotteryReplayMetrics metrics = service.replayMetrics(12);

        assertThat(metrics.getRequestedWindow()).isEqualTo(12);
        assertThat(metrics.getActualWindow()).isZero();
        assertThat(metrics.getPrizeDistribution()).isEmpty();
        assertThat(metrics.getGeneratedAt()).isNotNull();
    }

    private static LotteryTrainingReport.TrainingTimelineItem timeline(int period, int score, int redHits,
                                                                       boolean blueHit, String prizeName) {
        LotteryTrainingReport.TrainingTimelineItem item = new LotteryTrainingReport.TrainingTimelineItem();
        item.setPeriod(period);
        item.setScore(score);
        item.setRedHits(redHits);
        item.setBlueHit(blueHit);
        item.setPrizeName(prizeName);
        return item;
    }
}
