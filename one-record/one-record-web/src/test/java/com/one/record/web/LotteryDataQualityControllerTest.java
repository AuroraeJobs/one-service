package com.one.record.web;

import com.one.record.lottery.LotteryDataQualityReport;
import com.one.record.lottery.LotteryDataQualityRepairRequest;
import com.one.record.lottery.LotteryDataQualityRepairResult;
import com.one.record.service.ILotteryDataQualityService;
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

class LotteryDataQualityControllerTest {

    private ILotteryDataQualityService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryDataQualityService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryDataQualityController(service)).build();
    }

    @Test
    void reportDelegatesToService() throws Exception {
        when(service.report()).thenReturn(LotteryDataQualityReport.builder()
                .totalRecords(10)
                .missingIssueCount(1)
                .duplicateIssueCount(1)
                .malformedRecordCount(1)
                .futureDateCount(1)
                .missingIssues(List.of("2026002"))
                .build());

        mockMvc.perform(get("/lottery/data-quality"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRecords").value(10))
                .andExpect(jsonPath("$.missingIssueCount").value(1))
                .andExpect(jsonPath("$.missingIssues[0]").value("2026002"));

        verify(service).report();
    }

    @Test
    void dryRunMissingIssuesRepairDelegatesToService() throws Exception {
        when(service.dryRunMissingIssuesRepair(org.mockito.ArgumentMatchers.any(LotteryDataQualityRepairRequest.class)))
                .thenReturn(LotteryDataQualityRepairResult.builder()
                        .repairType("MISSING_ISSUES")
                        .dryRun(true)
                        .repairableIssueCount(1)
                        .repairableIssues(List.of("2026002"))
                        .build());

        mockMvc.perform(post("/lottery/data-quality/repair/missing-issues/dry-run")
                        .contentType("application/json")
                        .content("{\"issues\":[\"2026002\"],\"limit\":10}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dryRun").value(true))
                .andExpect(jsonPath("$.repairableIssueCount").value(1))
                .andExpect(jsonPath("$.repairableIssues[0]").value("2026002"));

        verify(service).dryRunMissingIssuesRepair(org.mockito.ArgumentMatchers.any(LotteryDataQualityRepairRequest.class));
    }

    @Test
    void confirmMissingIssuesRepairDelegatesToService() throws Exception {
        when(service.confirmMissingIssuesRepair(org.mockito.ArgumentMatchers.any(LotteryDataQualityRepairRequest.class)))
                .thenReturn(LotteryDataQualityRepairResult.builder()
                        .repairType("MISSING_ISSUES")
                        .dryRun(false)
                        .repairedIssueCount(1)
                        .repairedIssues(List.of("2026002"))
                        .build());

        mockMvc.perform(post("/lottery/data-quality/repair/missing-issues/confirm")
                        .contentType("application/json")
                        .content("{\"issues\":[\"2026002\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dryRun").value(false))
                .andExpect(jsonPath("$.repairedIssueCount").value(1))
                .andExpect(jsonPath("$.repairedIssues[0]").value("2026002"));

        verify(service).confirmMissingIssuesRepair(org.mockito.ArgumentMatchers.any(LotteryDataQualityRepairRequest.class));
    }
}
