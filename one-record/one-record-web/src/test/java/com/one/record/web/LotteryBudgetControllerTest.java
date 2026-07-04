package com.one.record.web;

import com.one.record.lottery.LotteryBudgetStatus;
import com.one.record.service.ILotteryBudgetService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryBudgetControllerTest {

    private ILotteryBudgetService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryBudgetService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryBudgetController(service)).build();
    }

    @Test
    void statusDelegatesToService() throws Exception {
        when(service.status()).thenReturn(LotteryBudgetStatus.builder()
                .weeklyCost(new BigDecimal("12"))
                .weeklyUsagePercent(new BigDecimal("120.00"))
                .status("WARNING")
                .warnings(List.of(LotteryBudgetStatus.Warning.builder()
                        .key("weekly-budget")
                        .level("OVER")
                        .message("本周投入超过预算")
                        .build()))
                .build());

        mockMvc.perform(get("/lottery/budget/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weeklyCost").value(12))
                .andExpect(jsonPath("$.status").value("WARNING"))
                .andExpect(jsonPath("$.warnings[0].key").value("weekly-budget"));

        verify(service).status();
    }
}
