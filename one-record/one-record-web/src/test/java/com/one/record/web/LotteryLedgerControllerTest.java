package com.one.record.web;

import com.one.record.lottery.LotteryBacktestSummary;
import com.one.record.lottery.LotteryIssueLedger;
import com.one.record.lottery.LotteryLedgerSummary;
import com.one.record.lottery.LotteryMonthlyLedger;
import com.one.record.lottery.LotteryPerformanceLedger;
import com.one.record.service.ILotteryLedgerService;
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

    @Test
    void issuesDelegatesToService() throws Exception {
        when(service.issues()).thenReturn(List.of(LotteryIssueLedger.builder()
                .issue("2026001")
                .period(2026001L)
                .ticketCount(2)
                .totalCost(new BigDecimal("6"))
                .totalPrize(new BigDecimal("10"))
                .netResult(new BigDecimal("4"))
                .roiPercent(new BigDecimal("66.67"))
                .build()));

        mockMvc.perform(get("/lottery/ledger/issues"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].issue").value("2026001"))
                .andExpect(jsonPath("$[0].period").value(2026001))
                .andExpect(jsonPath("$[0].ticketCount").value(2))
                .andExpect(jsonPath("$[0].netResult").value(4))
                .andExpect(jsonPath("$[0].roiPercent").value(66.67));

        verify(service).issues();
    }

    @Test
    void monthsDelegatesToService() throws Exception {
        when(service.months()).thenReturn(List.of(LotteryMonthlyLedger.builder()
                .month("2026-07")
                .ticketCount(3)
                .totalCost(new BigDecimal("8"))
                .totalPrize(new BigDecimal("5"))
                .netResult(new BigDecimal("-3"))
                .roiPercent(new BigDecimal("-37.50"))
                .build()));

        mockMvc.perform(get("/lottery/ledger/months"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].month").value("2026-07"))
                .andExpect(jsonPath("$[0].ticketCount").value(3))
                .andExpect(jsonPath("$[0].totalPrize").value(5))
                .andExpect(jsonPath("$[0].netResult").value(-3))
                .andExpect(jsonPath("$[0].roiPercent").value(-37.50));

        verify(service).months();
    }

    @Test
    void performanceDelegatesToService() throws Exception {
        when(service.performance("rule")).thenReturn(List.of(LotteryPerformanceLedger.builder()
                .dimension("RULE")
                .key("rule-best")
                .name("最佳规则")
                .ticketCount(2)
                .totalCost(new BigDecimal("4"))
                .totalPrize(new BigDecimal("5"))
                .netResult(new BigDecimal("1"))
                .roiPercent(new BigDecimal("25.00"))
                .hitRatePercent(new BigDecimal("50.00"))
                .backtestSummary(LotteryBacktestSummary.builder()
                        .backtestId("bt-rule")
                        .stabilityScore(91)
                        .build())
                .build()));

        mockMvc.perform(get("/lottery/ledger/performance").param("dimension", "rule"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].dimension").value("RULE"))
                .andExpect(jsonPath("$[0].key").value("rule-best"))
                .andExpect(jsonPath("$[0].name").value("最佳规则"))
                .andExpect(jsonPath("$[0].roiPercent").value(25.00))
                .andExpect(jsonPath("$[0].hitRatePercent").value(50.00))
                .andExpect(jsonPath("$[0].backtestSummary.backtestId").value("bt-rule"))
                .andExpect(jsonPath("$[0].backtestSummary.stabilityScore").value(91));

        verify(service).performance("rule");
    }
}
