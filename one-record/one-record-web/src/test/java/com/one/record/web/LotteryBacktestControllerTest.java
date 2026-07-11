package com.one.record.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.one.record.lottery.LotteryBacktestRunRequest;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryBacktestReport;
import com.one.record.service.ILotteryBacktestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryBacktestControllerTest {

    private ILotteryBacktestService service;

    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryBacktestService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryBacktestController(service)).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void runDelegatesToService() throws Exception {
        when(service.run(any())).thenReturn(LotteryBacktestReport.builder()
                .id("bt-1")
                .strategyName("上一期基线")
                .replayCount(30)
                .baselineSeed(77L)
                .sameWindow(true)
                .sameBudget(true)
                .build());

        mockMvc.perform(post("/lottery/backtests/run")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(LotteryBacktestRunRequest.builder()
                                .presetWindow("latest-30")
                                .baselineSeed(77L)
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("bt-1"))
                .andExpect(jsonPath("$.replayCount").value(30))
                .andExpect(jsonPath("$.baselineSeed").value(77))
                .andExpect(jsonPath("$.sameWindow").value(true))
                .andExpect(jsonPath("$.sameBudget").value(true));

        ArgumentCaptor<LotteryBacktestRunRequest> requestCaptor = ArgumentCaptor.forClass(LotteryBacktestRunRequest.class);
        verify(service).run(requestCaptor.capture());
        assertThat(requestCaptor.getValue().getBaselineSeed()).isEqualTo(77L);
    }

    @Test
    void reportsDelegatesToService() throws Exception {
        when(service.reports(0, 20, "基线", "latest-30", 1L, 9L)).thenReturn(LotteryPageResponse.<LotteryBacktestReport>builder()
                .items(List.of(LotteryBacktestReport.builder().id("bt-1").build()))
                .page(0)
                .pageSize(20)
                .total(1L)
                .hasNext(false)
                .build());

        mockMvc.perform(get("/lottery/backtests")
                        .param("page", "0")
                        .param("pageSize", "20")
                        .param("strategyName", "基线")
                        .param("presetWindow", "latest-30")
                        .param("createdStartAt", "1")
                        .param("createdEndAt", "9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value("bt-1"))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void detailDelegatesToService() throws Exception {
        when(service.detail("bt-1")).thenReturn(LotteryBacktestReport.builder().id("bt-1").build());

        mockMvc.perform(get("/lottery/backtests/bt-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("bt-1"));
    }
}
