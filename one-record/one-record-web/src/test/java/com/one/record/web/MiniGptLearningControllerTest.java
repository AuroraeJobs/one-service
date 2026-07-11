package com.one.record.web;

import com.one.record.ai.MiniGptLotteryCorpusExport;
import com.one.record.exception.MiniGptLotteryCorpusException;
import com.one.record.service.IMiniGptLearningService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

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
}
