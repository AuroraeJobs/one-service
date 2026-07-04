package com.one.record.web;

import com.one.record.lottery.LotteryOperationsHealthContributor;
import com.one.record.lottery.LotteryOperationsHealthSummary;
import com.one.record.service.ILotteryOperationsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryOperationsControllerTest {

    private ILotteryOperationsService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryOperationsService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryOperationsController(service)).build();
    }

    @Test
    void healthDelegatesToService() throws Exception {
        when(service.health()).thenReturn(LotteryOperationsHealthSummary.builder()
                .score(92)
                .status("PASS")
                .latestIssue("2026068")
                .contributors(List.of(LotteryOperationsHealthContributor.builder()
                        .key("data-quality")
                        .label("Data quality")
                        .score(100)
                        .status("PASS")
                        .build()))
                .generatedAt(100L)
                .build());

        mockMvc.perform(get("/lottery/operations/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(92))
                .andExpect(jsonPath("$.status").value("PASS"))
                .andExpect(jsonPath("$.latestIssue").value("2026068"))
                .andExpect(jsonPath("$.contributors[0].key").value("data-quality"));

        verify(service).health();
    }

    @Test
    void acknowledgeHealthDelegatesToService() throws Exception {
        when(service.acknowledgeHealth(any())).thenReturn(LotteryOperationsHealthSummary.builder()
                .score(80)
                .status("WARNING")
                .contributors(List.of())
                .build());

        mockMvc.perform(post("/lottery/operations/health/acknowledge")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"contributorKey\":\"data-quality\",\"note\":\"reviewed\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(80))
                .andExpect(jsonPath("$.status").value("WARNING"));

        verify(service).acknowledgeHealth(any());
    }
}
