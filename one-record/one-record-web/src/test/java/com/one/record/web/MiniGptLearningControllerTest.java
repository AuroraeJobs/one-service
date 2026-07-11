package com.one.record.web;

import com.one.record.ai.MiniGptLotteryCorpusExport;
import com.one.record.ai.MiniGptGenerationBatchRequest;
import com.one.record.ai.MiniGptGenerationBatchResult;
import com.one.record.ai.MiniGptGenerationResult;
import com.one.record.exception.MiniGptLotteryCorpusException;
import com.one.record.exception.MiniGptTrainingValidationException;
import com.one.record.service.IMiniGptLearningService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MiniGptLearningControllerTest {

    private IMiniGptLearningService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(IMiniGptLearningService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new MiniGptLearningController(service))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void lotteryCorpusExportBindsStrategyFormatAndReturnsSplitProvenance() throws Exception {
        when(service.exportLotteryCorpus("strategy", 2000)).thenReturn(MiniGptLotteryCorpusExport.builder()
                .schemaVersion(1)
                .templateVersion("lottery-strategy-v1")
                .corpusVersion("corpus-sha")
                .format("strategy")
                .splitMode("TIME_ORDERED_80_20")
                .validationRatio(0.2)
                .sortOrder("issue:asc")
                .dataPath("data/lottery-strategy.txt")
                .fullDataPath("data/lottery-corpora/strategy/corpus-sha/all.txt")
                .trainDataPath("data/lottery-corpora/strategy/corpus-sha/train.txt")
                .validationDataPath("data/lottery-corpora/strategy/corpus-sha/validation.txt")
                .manifestDataPath("data/lottery-corpora/strategy/corpus-sha/manifest.json")
                .drawCount(10)
                .trainDrawCount(8)
                .validationDrawCount(2)
                .trainFirstIssue("2026001")
                .trainLatestIssue("2026008")
                .validationFirstIssue("2026009")
                .validationLatestIssue("2026010")
                .contentSha256("content-sha")
                .trainSha256("train-sha")
                .validationSha256("validation-sha")
                .generatedAt(100L)
                .build());

        mockMvc.perform(post("/ai/minigpt/corpus/lottery/export")
                        .param("format", "strategy")
                        .param("limit", "2000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.schemaVersion").value(1))
                .andExpect(jsonPath("$.format").value("strategy"))
                .andExpect(jsonPath("$.corpusVersion").value("corpus-sha"))
                .andExpect(jsonPath("$.trainDrawCount").value(8))
                .andExpect(jsonPath("$.validationDrawCount").value(2))
                .andExpect(jsonPath("$.trainDataPath").value("data/lottery-corpora/strategy/corpus-sha/train.txt"))
                .andExpect(jsonPath("$.validationDataPath").value("data/lottery-corpora/strategy/corpus-sha/validation.txt"))
                .andExpect(jsonPath("$.manifestDataPath").value("data/lottery-corpora/strategy/corpus-sha/manifest.json"));

        verify(service).exportLotteryCorpus("strategy", 2000);
    }

    @Test
    void insufficientLotteryCorpusReturnsUnprocessableEntity() throws Exception {
        when(service.exportLotteryCorpus("strategy", 1))
                .thenThrow(new MiniGptLotteryCorpusException("MiniGPT 彩票语料至少需要 2 个有效且唯一的期号"));

        mockMvc.perform(post("/ai/minigpt/corpus/lottery/export")
                        .param("format", "strategy")
                        .param("limit", "1"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("MiniGPT 彩票语料至少需要 2 个有效且唯一的期号"));

        verify(service).exportLotteryCorpus("strategy", 1);
    }

    @Test
    void unsupportedLotteryCorpusFormatReturnsUnprocessableEntity() throws Exception {
        when(service.exportLotteryCorpus("jsonl", 10))
                .thenThrow(new MiniGptLotteryCorpusException("不支持的 MiniGPT 彩票语料格式: jsonl"));

        mockMvc.perform(post("/ai/minigpt/corpus/lottery/export")
                        .param("format", "jsonl")
                        .param("limit", "10"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("不支持的 MiniGPT 彩票语料格式: jsonl"));

        verify(service).exportLotteryCorpus("jsonl", 10);
    }

    @Test
    void lotteryCorpusFilesystemFailureReturnsInternalServerError() throws Exception {
        when(service.exportLotteryCorpus("strategy", 10))
                .thenThrow(new IllegalStateException("写入 MiniGPT 彩票语料失败"));

        mockMvc.perform(post("/ai/minigpt/corpus/lottery/export")
                        .param("format", "strategy")
                        .param("limit", "10"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value(500))
                .andExpect(jsonPath("$.message").value("服务器内部错误: 写入 MiniGPT 彩票语料失败"));

        verify(service).exportLotteryCorpus("strategy", 10);
    }

    @Test
    void formalTrainingValidationReturnsUnprocessableEntityWithBoundProvenance() throws Exception {
        when(service.startTraining(argThat(request -> request != null
                && "corpus-v1".equals(request.getCorpusVersion())
                && "train-sha".equals(request.getTrainSha256())
                && "validation-sha".equals(request.getValidationSha256())
                && Long.valueOf(77L).equals(request.getSeed()))))
                .thenThrow(new MiniGptTrainingValidationException("MiniGPT Block Size=128 无法容纳最长完整样本"));

        mockMvc.perform(post("/ai/minigpt/training/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "data":"data/lottery-corpora/strategy/corpus-v1/train.txt",
                                  "evalData":"data/lottery-corpora/strategy/corpus-v1/validation.txt",
                                  "manifestDataPath":"data/lottery-corpora/strategy/corpus-v1/manifest.json",
                                  "corpusVersion":"corpus-v1",
                                  "trainSha256":"train-sha",
                                  "validationSha256":"validation-sha",
                                  "seed":77,
                                  "blockSize":128
                                }
                                """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("MiniGPT Block Size=128 无法容纳最长完整样本"));
    }

    @Test
    void generationBatchBindsControlsAndReturnsProvenanceMetrics() throws Exception {
        MiniGptGenerationResult item = MiniGptGenerationResult.builder()
                .generationId("generation-1")
                .batchId("batch-1")
                .runId("run-1")
                .runName("lottery-run")
                .seed(42L)
                .strategyLabel("balanced")
                .poolSelected(true)
                .poolDecision("SELECTED_BLUE_COVERAGE")
                .batchBaseSeed(42L)
                .batchMaxRedOverlap(3)
                .batchMinimumBlueCoverage(2)
                .batchMinimumBlueCoverageMet(true)
                .batchStrategies(List.of("balanced"))
                .build();
        when(service.generateBatch(any(MiniGptGenerationBatchRequest.class))).thenReturn(
                MiniGptGenerationBatchResult.builder()
                        .batchId("batch-1")
                        .runId("run-1")
                        .runName("lottery-run")
                        .corpusVersion("corpus-v1")
                        .trainSha256("train-sha")
                        .validationSha256("validation-sha")
                        .checkpointSha256("checkpoint-sha")
                        .modelConfig(Map.of("block_size", 160))
                        .requestedCount(3)
                        .baseSeed(42L)
                        .maxRedOverlap(3)
                        .minimumBlueCoverage(2)
                        .minimumBlueCoverageMet(true)
                        .requestedStrategies(List.of("balanced"))
                        .generatedCount(3)
                        .generatedRate(1.0)
                        .parseableCount(3)
                        .parseableRate(1.0)
                        .legalCount(2)
                        .legalRate(2.0 / 3)
                        .repairedCount(1)
                        .repairedRate(1.0 / 3)
                        .postRepairLegalCount(3)
                        .postRepairLegalRate(1.0)
                        .repairReasonCounts(Map.of("RED_NOT_ASCENDING", 1))
                        .redOverlapMax(3)
                        .redOverlapAverage(2.5)
                        .distinctBlueCount(2)
                        .blueCoverage(2.0 / 3)
                        .strategyComposition(Map.of("balanced", 3))
                        .items(List.of(item))
                        .generatedAt(100L)
                        .build()
        );

        mockMvc.perform(post("/ai/minigpt/generation/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "runName":"lottery-run",
                                  "candidateCount":3,
                                  "baseSeed":42,
                                  "maxRedOverlap":3,
                                  "minimumBlueCoverage":2,
                                  "strategies":["balanced"]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batchId").value("batch-1"))
                .andExpect(jsonPath("$.corpusVersion").value("corpus-v1"))
                .andExpect(jsonPath("$.generatedCount").value(3))
                .andExpect(jsonPath("$.baseSeed").value(42))
                .andExpect(jsonPath("$.maxRedOverlap").value(3))
                .andExpect(jsonPath("$.minimumBlueCoverage").value(2))
                .andExpect(jsonPath("$.minimumBlueCoverageMet").value(true))
                .andExpect(jsonPath("$.requestedStrategies[0]").value("balanced"))
                .andExpect(jsonPath("$.postRepairLegalRate").value(1.0))
                .andExpect(jsonPath("$.redOverlapMax").value(3))
                .andExpect(jsonPath("$.distinctBlueCount").value(2))
                .andExpect(jsonPath("$.strategyComposition.balanced").value(3))
                .andExpect(jsonPath("$.items[0].generationId").value("generation-1"))
                .andExpect(jsonPath("$.items[0].poolSelected").value(true))
                .andExpect(jsonPath("$.items[0].batchBaseSeed").value(42))
                .andExpect(jsonPath("$.items[0].batchMaxRedOverlap").value(3))
                .andExpect(jsonPath("$.items[0].batchMinimumBlueCoverage").value(2))
                .andExpect(jsonPath("$.items[0].batchMinimumBlueCoverageMet").value(true))
                .andExpect(jsonPath("$.items[0].batchStrategies[0]").value("balanced"));

        verify(service).generateBatch(argThat(request -> {
            assertThat(request.getCandidateCount()).isEqualTo(3);
            assertThat(request.getBaseSeed()).isEqualTo(42L);
            assertThat(request.getMaxRedOverlap()).isEqualTo(3);
            assertThat(request.getMinimumBlueCoverage()).isEqualTo(2);
            assertThat(request.getStrategies()).containsExactly("balanced");
            return true;
        }));
    }
}
