package com.one.record.web;

import com.one.record.lottery.LotterySimulationResult;
import com.one.record.service.ILotterySimulationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotterySimulationControllerTest {

    private ILotterySimulationService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotterySimulationService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotterySimulationController(service)).build();
    }

    @Test
    void runDelegatesToService() throws Exception {
        when(service.simulate(any())).thenReturn(LotterySimulationResult.builder()
                .targetIssue("2026068")
                .riskLevel("LOW")
                .proposedCost(new BigDecimal("6.00"))
                .warnings(List.of())
                .build());

        mockMvc.perform(post("/lottery/simulations/run")
                        .contentType("application/json")
                        .content("{\"targetIssue\":\"2026068\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.targetIssue").value("2026068"))
                .andExpect(jsonPath("$.riskLevel").value("LOW"))
                .andExpect(jsonPath("$.proposedCost").value(6.00));

        verify(service).simulate(any());
    }
}
