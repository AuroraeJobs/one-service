package com.one.record.service.impl;

import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.repository.LotteryPredictionSnapshotRepository;
import com.one.record.training.LotteryLatestPrediction;
import com.one.record.training.LotteryPredictionCandidate;
import org.mockito.ArgumentCaptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryTrainingServiceTest {

    private LotteryPredictionSnapshotRepository predictionSnapshotRepository;

    private LotteryTrainingService service;

    @BeforeEach
    void setUp() {
        predictionSnapshotRepository = mock(LotteryPredictionSnapshotRepository.class);
        service = new LotteryTrainingService(mock(StringRedisTemplate.class), predictionSnapshotRepository);
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
}
