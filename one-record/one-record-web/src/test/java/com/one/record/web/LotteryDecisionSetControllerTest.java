package com.one.record.web;

import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryDecisionCandidateSelection;
import com.one.record.model.LotteryDecisionSet;
import com.one.record.service.ILotteryDecisionSetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryDecisionSetControllerTest {

    private ILotteryDecisionSetService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryDecisionSetService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryDecisionSetController(service)).build();
    }

    @Test
    void decisionSetsDelegatesToService() throws Exception {
        when(service.decisionSets(true, 2, 5)).thenReturn(LotteryPageResponse.<LotteryDecisionSet>builder()
                .items(List.of(LotteryDecisionSet.builder().id("decision-1").title("第 2026068 期决策集").build()))
                .page(2)
                .pageSize(5)
                .total(7L)
                .hasNext(true)
                .build());

        mockMvc.perform(get("/lottery/decision-sets")
                        .param("includeArchived", "true")
                        .param("page", "2")
                        .param("pageSize", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value("decision-1"))
                .andExpect(jsonPath("$.items[0].title").value("第 2026068 期决策集"))
                .andExpect(jsonPath("$.page").value(2))
                .andExpect(jsonPath("$.hasNext").value(true));

        verify(service).decisionSets(true, 2, 5);
    }

    @Test
    void createDecisionSetDelegatesToService() throws Exception {
        when(service.createDecisionSet(any(LotteryDecisionSet.class))).thenReturn(LotteryDecisionSet.builder()
                .id("decision-1")
                .selectedCandidates(List.of(LotteryDecisionCandidateSelection.builder().key("row-1").build()))
                .build());

        mockMvc.perform(post("/lottery/decision-sets")
                        .contentType("application/json")
                        .content("{\"targetIssue\":\"2026068\",\"selectedCandidates\":[{\"key\":\"row-1\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("decision-1"))
                .andExpect(jsonPath("$.selectedCandidates[0].key").value("row-1"));

        verify(service).createDecisionSet(any(LotteryDecisionSet.class));
    }

    @Test
    void updateDecisionSetDelegatesToService() throws Exception {
        when(service.updateDecisionSet(eq("decision-1"), any(LotteryDecisionSet.class))).thenReturn(LotteryDecisionSet.builder()
                .id("decision-1")
                .title("复盘用决策")
                .build());

        mockMvc.perform(put("/lottery/decision-sets/decision-1")
                        .contentType("application/json")
                        .content("{\"title\":\"复盘用决策\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("复盘用决策"));

        verify(service).updateDecisionSet(eq("decision-1"), any(LotteryDecisionSet.class));
    }

    @Test
    void archiveDecisionSetDelegatesToService() throws Exception {
        when(service.archiveDecisionSet("decision-1")).thenReturn(LotteryDecisionSet.builder()
                .id("decision-1")
                .archived(true)
                .build());

        mockMvc.perform(patch("/lottery/decision-sets/decision-1/archive"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archived").value(true));

        verify(service).archiveDecisionSet("decision-1");
    }
}
