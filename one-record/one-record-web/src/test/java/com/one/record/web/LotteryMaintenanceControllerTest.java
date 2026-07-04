package com.one.record.web;

import com.one.record.lottery.LotteryMaintenanceSummary;
import com.one.record.service.ILotteryMaintenanceService;
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

class LotteryMaintenanceControllerTest {

    private ILotteryMaintenanceService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryMaintenanceService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryMaintenanceController(service)).build();
    }

    @Test
    void summaryDelegatesToService() throws Exception {
        when(service.summary()).thenReturn(summary());

        mockMvc.perform(get("/lottery/maintenance/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dryRun").value(true))
                .andExpect(jsonPath("$.collections[0].collection").value("lottery_record_sync_logs"));

        verify(service).summary();
    }

    @Test
    void cleanupDryRunDelegatesToService() throws Exception {
        when(service.cleanupDryRun()).thenReturn(summary());

        mockMvc.perform(post("/lottery/maintenance/cleanup/dry-run"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dryRun").value(true));

        verify(service).cleanupDryRun();
    }

    private static LotteryMaintenanceSummary summary() {
        return LotteryMaintenanceSummary.builder()
                .dryRun(true)
                .collections(List.of(LotteryMaintenanceSummary.CollectionStatus.builder()
                        .collection("lottery_record_sync_logs")
                        .totalCount(2L)
                        .staleCount(1L)
                        .cleanupSupported(true)
                        .build()))
                .caches(List.of(LotteryMaintenanceSummary.CacheStatus.builder()
                        .cacheKey("lottery:statistics:summary")
                        .present(true)
                        .noExpiry(true)
                        .cleanupSupported(false)
                        .build()))
                .generatedAt(100L)
                .build();
    }
}
