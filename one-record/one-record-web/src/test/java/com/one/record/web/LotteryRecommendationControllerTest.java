package com.one.record.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryRecommendationStatusRequest;
import com.one.record.model.LotteryRecommendation;
import com.one.record.service.ILotteryRecommendationService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryRecommendationControllerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void listRefreshAndUpdateStatus() throws Exception {
        ILotteryRecommendationService service = mock(ILotteryRecommendationService.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new LotteryRecommendationController(service)).build();
        when(service.recommendations("PROMOTE", 1, 20)).thenReturn(page());
        when(service.refresh(5)).thenReturn(page());
        when(service.updateStatus(org.mockito.Mockito.eq("rec-1"), org.mockito.Mockito.any())).thenReturn(recommendation("APPLIED"));

        mockMvc.perform(get("/lottery/recommendations").param("recommendationState", "PROMOTE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].recommendationState").value("PROMOTE"));

        mockMvc.perform(post("/lottery/recommendations/refresh").param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1));

        mockMvc.perform(patch("/lottery/recommendations/rec-1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(LotteryRecommendationStatusRequest.builder().lifecycleStatus("APPLIED").build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lifecycleStatus").value("APPLIED"));
    }

    private LotteryPageResponse<LotteryRecommendation> page() {
        return LotteryPageResponse.<LotteryRecommendation>builder()
                .items(List.of(recommendation("OPEN")))
                .page(1)
                .pageSize(20)
                .total(1L)
                .build();
    }

    private LotteryRecommendation recommendation(String lifecycleStatus) {
        return LotteryRecommendation.builder()
                .id("rec-1")
                .recommendationState("PROMOTE")
                .lifecycleStatus(lifecycleStatus)
                .title("推荐")
                .build();
    }
}
