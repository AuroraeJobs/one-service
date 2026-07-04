package com.one.record.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.one.record.lottery.LotteryExperimentRunRequest;
import com.one.record.lottery.LotteryExperimentUpdateRequest;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryStrategyExperiment;
import com.one.record.service.ILotteryExperimentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryExperimentControllerTest {

    private ILotteryExperimentService service;

    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryExperimentService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryExperimentController(service)).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void runDelegatesToService() throws Exception {
        when(service.runExperiment(org.mockito.ArgumentMatchers.any())).thenReturn(LotteryStrategyExperiment.builder()
                .id("exp-1")
                .strategyName("近期平衡")
                .build());

        mockMvc.perform(post("/lottery/experiments/run")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(LotteryExperimentRunRequest.builder()
                                .strategyName("近期平衡")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("exp-1"))
                .andExpect(jsonPath("$.strategyName").value("近期平衡"));
    }

    @Test
    void listDelegatesToService() throws Exception {
        when(service.experiments(0, 20, "平衡", "稳健", 1L, 9L)).thenReturn(LotteryPageResponse.<LotteryStrategyExperiment>builder()
                .items(List.of(LotteryStrategyExperiment.builder().id("exp-1").build()))
                .page(0)
                .pageSize(20)
                .total(1L)
                .hasNext(false)
                .build());

        mockMvc.perform(get("/lottery/experiments")
                        .param("page", "0")
                        .param("pageSize", "20")
                        .param("strategyName", "平衡")
                        .param("tag", "稳健")
                        .param("createdStartAt", "1")
                        .param("createdEndAt", "9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value("exp-1"))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void detailAndPatchDelegateToService() throws Exception {
        when(service.detail("exp-1")).thenReturn(LotteryStrategyExperiment.builder().id("exp-1").build());
        when(service.updateNotes(org.mockito.ArgumentMatchers.eq("exp-1"), org.mockito.ArgumentMatchers.any()))
                .thenReturn(LotteryStrategyExperiment.builder().id("exp-1").notes("updated").build());

        mockMvc.perform(get("/lottery/experiments/exp-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("exp-1"));

        mockMvc.perform(patch("/lottery/experiments/exp-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(LotteryExperimentUpdateRequest.builder()
                                .notes("updated")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes").value("updated"));

        verify(service).detail("exp-1");
    }
}
