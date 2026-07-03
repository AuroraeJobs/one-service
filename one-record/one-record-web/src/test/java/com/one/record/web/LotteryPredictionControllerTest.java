package com.one.record.web;

import com.one.record.model.LotteryPredictionRuleRecord;
import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.service.ILotteryTrainingService;
import com.one.record.training.LotteryReplayMetrics;
import com.one.record.training.LotteryTrainingStatus;
import com.one.record.training.LotteryRuleComparison;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryPredictionControllerTest {

    private ILotteryTrainingService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryTrainingService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryPredictionController(service)).build();
    }

    @Test
    void historyBindsLimit() throws Exception {
        when(service.predictionHistory(10)).thenReturn(List.of(LotteryPredictionSnapshot.builder()
                .id("snapshot-1")
                .title("综合推荐")
                .blueNumber("07")
                .build()));

        mockMvc.perform(get("/lottery/predictions").param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("snapshot-1"))
                .andExpect(jsonPath("$[0].title").value("综合推荐"));

        verify(service).predictionHistory(10);
    }

    @Test
    void detailUsesSnapshotId() throws Exception {
        when(service.predictionDetail("snapshot-1")).thenReturn(LotteryPredictionSnapshot.builder()
                .id("snapshot-1")
                .blueNumber("07")
                .build());

        mockMvc.perform(get("/lottery/predictions/snapshot-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("snapshot-1"))
                .andExpect(jsonPath("$.blueNumber").value("07"));

        verify(service).predictionDetail("snapshot-1");
    }

    @Test
    void attachActualDelegatesToTrainingService() throws Exception {
        when(service.attachPredictionActual(org.mockito.ArgumentMatchers.eq("snapshot-1"), org.mockito.ArgumentMatchers.any()))
                .thenReturn(LotteryPredictionSnapshot.builder()
                        .id("snapshot-1")
                        .blueNumber("07")
                        .build());

        mockMvc.perform(post("/lottery/predictions/snapshot-1/actual")
                        .contentType("application/json")
                        .content("{\"period\":2026002,\"redNumbers\":[\"01\",\"02\",\"03\",\"04\",\"05\",\"06\"],\"blueNumber\":\"07\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("snapshot-1"))
                .andExpect(jsonPath("$.blueNumber").value("07"));

        verify(service).attachPredictionActual(org.mockito.ArgumentMatchers.eq("snapshot-1"), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void rulesBindsLimit() throws Exception {
        when(service.predictionRules(5)).thenReturn(List.of(LotteryPredictionRuleRecord.builder()
                .ruleId("rule-1")
                .ruleName("规则一")
                .rankScore(99)
                .build()));

        mockMvc.perform(get("/lottery/predictions/rules").param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ruleId").value("rule-1"))
                .andExpect(jsonPath("$[0].rankScore").value(99));

        verify(service).predictionRules(5);
    }

    @Test
    void compareRulesReturnsBestRule() throws Exception {
        when(service.comparePredictionRules(5)).thenReturn(LotteryRuleComparison.builder()
                .bestRuleId("rule-1")
                .bestRuleName("规则一")
                .bestRankScore(99)
                .build());

        mockMvc.perform(get("/lottery/predictions/rules/compare").param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bestRuleId").value("rule-1"))
                .andExpect(jsonPath("$.bestRankScore").value(99));

        verify(service).comparePredictionRules(5);
    }

    @Test
    void replayMetricsBindsWindow() throws Exception {
        when(service.replayMetrics(12)).thenReturn(LotteryReplayMetrics.builder()
                .requestedWindow(12)
                .actualWindow(10)
                .averageScore(88.8)
                .blueHitRate(20)
                .build());

        mockMvc.perform(get("/lottery/predictions/replay-metrics").param("window", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestedWindow").value(12))
                .andExpect(jsonPath("$.actualWindow").value(10))
                .andExpect(jsonPath("$.blueHitRate").value(20));

        verify(service).replayMetrics(12);
    }

    @Test
    void trainingStatusDelegatesToService() throws Exception {
        LotteryTrainingStatus status = new LotteryTrainingStatus();
        status.setRunning(true);
        status.setPercent(42);
        status.setReplayCount(30);
        when(service.trainingStatus()).thenReturn(status);

        mockMvc.perform(get("/lottery/predictions/training/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.running").value(true))
                .andExpect(jsonPath("$.percent").value(42))
                .andExpect(jsonPath("$.replayCount").value(30));

        verify(service).trainingStatus();
    }

    @Test
    void cancelTrainingDelegatesToService() throws Exception {
        LotteryTrainingStatus status = new LotteryTrainingStatus();
        status.setCancelled(true);
        status.setStage("正在取消训练");
        when(service.cancelTraining()).thenReturn(status);

        mockMvc.perform(post("/lottery/predictions/training/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cancelled").value(true))
                .andExpect(jsonPath("$.stage").value("正在取消训练"));

        verify(service).cancelTraining();
    }

    @Test
    void retryTrainingDelegatesToService() throws Exception {
        LotteryTrainingStatus status = new LotteryTrainingStatus();
        status.setRunning(true);
        status.setScale("fast");
        when(service.retryTraining()).thenReturn(status);

        mockMvc.perform(post("/lottery/predictions/training/retry"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.running").value(true))
                .andExpect(jsonPath("$.scale").value("fast"));

        verify(service).retryTraining();
    }

    @Test
    void trainDelegatesToTrainingService() throws Exception {
        LotteryTrainingStatus status = new LotteryTrainingStatus();
        status.setRunning(true);
        status.setStage("准备训练");
        when(service.startTraining(30, "fast")).thenReturn(status);

        mockMvc.perform(post("/lottery/predictions/train")
                        .contentType("application/json")
                        .content("{\"replayCount\":30,\"scale\":\"fast\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.running").value(true))
                .andExpect(jsonPath("$.stage").value("准备训练"));

        verify(service).startTraining(30, "fast");
    }
}
