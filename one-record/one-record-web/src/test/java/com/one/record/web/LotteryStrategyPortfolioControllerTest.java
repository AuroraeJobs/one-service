package com.one.record.web;

import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryStrategyPortfolioSummary;
import com.one.record.model.LotteryStrategyPortfolio;
import com.one.record.service.ILotteryStrategyPortfolioService;
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

class LotteryStrategyPortfolioControllerTest {

    private ILotteryStrategyPortfolioService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryStrategyPortfolioService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryStrategyPortfolioController(service)).build();
    }

    @Test
    void portfoliosAndDetailDelegateToService() throws Exception {
        when(service.portfolios(false, 1, 20)).thenReturn(LotteryPageResponse.<LotteryStrategyPortfolioSummary>builder()
                .items(List.of(summary("portfolio-1", 88)))
                .page(1)
                .pageSize(20)
                .total(1L)
                .build());
        when(service.detail("portfolio-1")).thenReturn(summary("portfolio-1", 88));

        mockMvc.perform(get("/lottery/strategy-portfolios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].portfolio.id").value("portfolio-1"))
                .andExpect(jsonPath("$.items[0].healthScore").value(88));

        mockMvc.perform(get("/lottery/strategy-portfolios/portfolio-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.portfolio.id").value("portfolio-1"));

        verify(service).portfolios(false, 1, 20);
        verify(service).detail("portfolio-1");
    }

    @Test
    void createUpdateAndArchiveDelegateToService() throws Exception {
        when(service.create(any(LotteryStrategyPortfolio.class))).thenReturn(summary("portfolio-1", 75));
        when(service.update(eq("portfolio-1"), any(LotteryStrategyPortfolio.class))).thenReturn(summary("portfolio-1", 80));
        when(service.archive("portfolio-1")).thenReturn(summary("portfolio-1", 70));

        mockMvc.perform(post("/lottery/strategy-portfolios")
                        .contentType("application/json")
                        .content("{\"name\":\"稳态组合\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.portfolio.id").value("portfolio-1"));

        mockMvc.perform(put("/lottery/strategy-portfolios/portfolio-1")
                        .contentType("application/json")
                        .content("{\"name\":\"更新组合\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.healthScore").value(80));

        mockMvc.perform(patch("/lottery/strategy-portfolios/portfolio-1/archive"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.portfolio.id").value("portfolio-1"));

        verify(service).create(any(LotteryStrategyPortfolio.class));
        verify(service).update(eq("portfolio-1"), any(LotteryStrategyPortfolio.class));
        verify(service).archive("portfolio-1");
    }

    private static LotteryStrategyPortfolioSummary summary(String id, int score) {
        return LotteryStrategyPortfolioSummary.builder()
                .portfolio(LotteryStrategyPortfolio.builder().id(id).name("组合").build())
                .healthScore(score)
                .healthStatus("PASS")
                .evidence(List.of())
                .build();
    }
}
