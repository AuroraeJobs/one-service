package com.one.record.web;

import com.one.record.lottery.LotteryLedgerSummary;
import com.one.record.service.ILotteryLedgerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryLedgerControllerTest {

    private ILotteryLedgerService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryLedgerService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryLedgerController(service)).build();
    }

    @Test
    void summaryDelegatesToService() throws Exception {
        when(service.summary()).thenReturn(LotteryLedgerSummary.builder()
                .ticketCount(2)
                .totalCost(new BigDecimal("6"))
                .totalPrize(new BigDecimal("10"))
                .netResult(new BigDecimal("4"))
                .roiPercent(new BigDecimal("66.67"))
                .build());

        mockMvc.perform(get("/lottery/ledger/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticketCount").value(2))
                .andExpect(jsonPath("$.totalCost").value(6))
                .andExpect(jsonPath("$.netResult").value(4))
                .andExpect(jsonPath("$.roiPercent").value(66.67));

        verify(service).summary();
    }
}
