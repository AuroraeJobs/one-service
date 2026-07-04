package com.one.record.web;

import com.one.record.model.LotteryPreference;
import com.one.record.service.ILotteryPreferenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryPreferenceControllerTest {

    private ILotteryPreferenceService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryPreferenceService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryPreferenceController(service)).build();
    }

    @Test
    void preferenceDelegatesToService() throws Exception {
        when(service.preference()).thenReturn(LotteryPreference.builder()
                .defaultTrainingScale("standard")
                .defaultTicketSource("MANUAL")
                .build());

        mockMvc.perform(get("/lottery/preferences"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.defaultTrainingScale").value("standard"))
                .andExpect(jsonPath("$.defaultTicketSource").value("MANUAL"));

        verify(service).preference();
    }

    @Test
    void updatePreferenceDelegatesToService() throws Exception {
        when(service.updatePreference(any(LotteryPreference.class))).thenReturn(LotteryPreference.builder()
                .defaultTrainingScale("deep")
                .defaultReplayCount(30)
                .autoSavePredictions(true)
                .defaultTicketSource("PREDICTION")
                .build());

        mockMvc.perform(put("/lottery/preferences")
                        .contentType("application/json")
                        .content("{\"defaultTrainingScale\":\"deep\",\"defaultReplayCount\":30,\"autoSavePredictions\":true,\"defaultTicketSource\":\"PREDICTION\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.defaultTrainingScale").value("deep"))
                .andExpect(jsonPath("$.defaultReplayCount").value(30))
                .andExpect(jsonPath("$.autoSavePredictions").value(true))
                .andExpect(jsonPath("$.defaultTicketSource").value("PREDICTION"));

        verify(service).updatePreference(any(LotteryPreference.class));
    }
}
