package com.one.record.web;

import com.one.record.lottery.LotteryOutcomeAttribution;
import com.one.record.lottery.LotteryOutcomeAttributionRollup;
import com.one.record.service.ILotteryOutcomeAttributionService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryOutcomeAttributionControllerTest {

    @Test
    void recentAndIssueDelegateToService() throws Exception {
        ILotteryOutcomeAttributionService service = mock(ILotteryOutcomeAttributionService.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new LotteryOutcomeAttributionController(service)).build();
        when(service.recent(2)).thenReturn(List.of(attribution("2026068")));
        when(service.issue("2026068")).thenReturn(attribution("2026068"));
        when(service.rollup("recent10", 20)).thenReturn(LotteryOutcomeAttributionRollup.builder()
                .window("recent10")
                .issueCount(2)
                .rows(List.of(LotteryOutcomeAttributionRollup.RollupRow.builder()
                        .dimension("rule")
                        .label("稳态规则")
                        .evidenceQuality("STABLE")
                        .build()))
                .build());

        mockMvc.perform(get("/lottery/outcomes").param("limit", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].issue").value("2026068"));

        mockMvc.perform(get("/lottery/outcomes/rollup").param("window", "recent10").param("limit", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.window").value("recent10"))
                .andExpect(jsonPath("$.rows[0].dimension").value("rule"))
                .andExpect(jsonPath("$.rows[0].evidenceQuality").value("STABLE"));

        mockMvc.perform(get("/lottery/outcomes/2026068"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roiPercent").value(100.00));
    }

    private LotteryOutcomeAttribution attribution(String issue) {
        return LotteryOutcomeAttribution.builder()
                .issue(issue)
                .ticketCount(1)
                .roiPercent(new BigDecimal("100.00"))
                .calibrationState("PROMOTE_SIGNAL")
                .build();
    }
}
