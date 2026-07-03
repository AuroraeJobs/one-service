package com.one.record.web;

import com.one.record.lottery.LotteryDraw;
import com.one.record.lottery.LotteryStatisticsSummary;
import com.one.record.service.ILotteryStatisticsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryStatisticsControllerTest {

    private ILotteryStatisticsService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryStatisticsService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryStatisticsController(service)).build();
    }

    @Test
    void summaryReturnsStatisticsContract() throws Exception {
        when(service.summary()).thenReturn(LotteryStatisticsSummary.builder()
                .totalDraws(2)
                .latestIssue("2026002")
                .latestDraw(LotteryDraw.builder().issue("2026002").blueNumber("07").build())
                .redFrequency(List.of(LotteryStatisticsSummary.NumberFrequency.builder()
                        .number("01")
                        .count(2)
                        .percent(16.7)
                        .build()))
                .blueFrequency(List.of(LotteryStatisticsSummary.NumberFrequency.builder()
                        .number("07")
                        .count(2)
                        .percent(100)
                        .build()))
                .oddCountDistribution(List.of(LotteryStatisticsSummary.DistributionItem.builder()
                        .value("3")
                        .count(1)
                        .percent(50)
                        .build()))
                .generatedAt(123L)
                .build());

        mockMvc.perform(get("/lottery/statistics/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDraws").value(2))
                .andExpect(jsonPath("$.latestIssue").value("2026002"))
                .andExpect(jsonPath("$.latestDraw.blueNumber").value("07"))
                .andExpect(jsonPath("$.redFrequency[0].number").value("01"))
                .andExpect(jsonPath("$.blueFrequency[0].percent").value(100.0))
                .andExpect(jsonPath("$.oddCountDistribution[0].value").value("3"))
                .andExpect(jsonPath("$.generatedAt").value(123));

        verify(service).summary();
    }

    @Test
    void frequencyReturnsRedAndBlueBuckets() throws Exception {
        when(service.frequency()).thenReturn(Map.of(
                "red", List.of(LotteryStatisticsSummary.NumberFrequency.builder().number("01").count(2).percent(16.7).build()),
                "blue", List.of(LotteryStatisticsSummary.NumberFrequency.builder().number("07").count(2).percent(100).build())
        ));

        mockMvc.perform(get("/lottery/statistics/frequency"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.red[0].number").value("01"))
                .andExpect(jsonPath("$.blue[0].number").value("07"));

        verify(service).frequency();
    }

    @Test
    void distributionReturnsStructureBuckets() throws Exception {
        when(service.distribution()).thenReturn(Map.of(
                "redSum", List.of(LotteryStatisticsSummary.DistributionItem.builder().value("21").count(1).percent(50).build()),
                "oddCount", List.of(LotteryStatisticsSummary.DistributionItem.builder().value("3").count(1).percent(50).build())
        ));

        mockMvc.perform(get("/lottery/statistics/distribution"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.redSum[0].value").value("21"))
                .andExpect(jsonPath("$.oddCount[0].value").value("3"));

        verify(service).distribution();
    }
}
