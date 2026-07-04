package com.one.record.web;

import com.one.record.lottery.LotteryDraw;
import com.one.record.lottery.LotteryLedgerSummary;
import com.one.record.lottery.LotteryDailyState;
import com.one.record.lottery.LotteryWorkbenchDailyRunResult;
import com.one.record.lottery.LotteryWorkbenchStepResult;
import com.one.record.lottery.LotteryWorkbenchSummary;
import com.one.record.service.ILotteryWorkbenchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryWorkbenchControllerTest {

    private ILotteryWorkbenchService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryWorkbenchService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryWorkbenchController(service)).build();
    }

    @Test
    void summaryDelegatesToService() throws Exception {
        when(service.summary()).thenReturn(LotteryWorkbenchSummary.builder()
                .latestDraw(LotteryDraw.builder().issue("2026001").blueNumber("07").build())
                .pendingTicketCount(2)
                .ledgerSummary(LotteryLedgerSummary.builder()
                        .ticketCount(3)
                        .totalCost(new BigDecimal("6"))
                        .build())
                .generatedAt(100L)
                .build());

        mockMvc.perform(get("/lottery/workbench/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.latestDraw.issue").value("2026001"))
                .andExpect(jsonPath("$.latestDraw.blueNumber").value("07"))
                .andExpect(jsonPath("$.pendingTicketCount").value(2))
                .andExpect(jsonPath("$.ledgerSummary.ticketCount").value(3))
                .andExpect(jsonPath("$.generatedAt").value(100));

        verify(service).summary();
    }

    @Test
    void dailyRunDelegatesToService() throws Exception {
        when(service.dailyRun()).thenReturn(LotteryWorkbenchDailyRunResult.builder()
                .steps(List.of(LotteryWorkbenchStepResult.builder()
                        .step("record-sync")
                        .status("SUCCESS")
                        .savedCount(2)
                        .build()))
                .summary(LotteryWorkbenchSummary.builder().pendingTicketCount(0).build())
                .generatedAt(200L)
                .build());

        mockMvc.perform(post("/lottery/workbench/daily-run"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.steps[0].step").value("record-sync"))
                .andExpect(jsonPath("$.steps[0].status").value("SUCCESS"))
                .andExpect(jsonPath("$.steps[0].savedCount").value(2))
                .andExpect(jsonPath("$.summary.pendingTicketCount").value(0))
                .andExpect(jsonPath("$.generatedAt").value(200));

        verify(service).dailyRun();
    }

    @Test
    void dailyStateDelegatesToService() throws Exception {
        when(service.dailyState()).thenReturn(LotteryDailyState.builder()
                .latestIssue("2026001")
                .nextIssue("2026002")
                .syncState(LotteryDailyState.DailyStateItem.builder()
                        .key("sync")
                        .status("COMPLETE")
                        .path("/lottery/sync")
                        .build())
                .ticketState(LotteryDailyState.DailyStateItem.builder()
                        .key("tickets")
                        .status("PENDING")
                        .pendingCount(1)
                        .path("/lottery/tickets?issue=2026002")
                        .build())
                .pendingActions(List.of("tickets"))
                .generatedAt(300L)
                .build());

        mockMvc.perform(get("/lottery/workbench/daily-state"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.latestIssue").value("2026001"))
                .andExpect(jsonPath("$.nextIssue").value("2026002"))
                .andExpect(jsonPath("$.syncState.status").value("COMPLETE"))
                .andExpect(jsonPath("$.ticketState.pendingCount").value(1))
                .andExpect(jsonPath("$.pendingActions[0]").value("tickets"))
                .andExpect(jsonPath("$.generatedAt").value(300));

        verify(service).dailyState();
    }
}
