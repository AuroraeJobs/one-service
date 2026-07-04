package com.one.record.web;

import com.one.record.lottery.LotteryExportResult;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.service.ILotteryExportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryExportControllerTest {

    private ILotteryExportService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryExportService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryExportController(service)).build();
    }

    @Test
    void exportDelegatesToService() throws Exception {
        when(service.export(eq("tickets"), anyMap())).thenReturn(LotteryExportResult.builder()
                .exportType("tickets")
                .filters(Map.of("status", "BOUGHT"))
                .rowCount(1)
                .content("id\n1")
                .build());

        mockMvc.perform(get("/lottery/exports/tickets?status=BOUGHT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exportType").value("tickets"))
                .andExpect(jsonPath("$.rowCount").value(1));

        verify(service).export(eq("tickets"), anyMap());
    }

    @Test
    void auditEventsDelegatesToService() throws Exception {
        when(service.auditEvents(10)).thenReturn(List.of(LotteryAuditEvent.builder()
                .eventType("EXPORT")
                .targetType("tickets")
                .rowCount(1)
                .build()));

        mockMvc.perform(get("/lottery/audit/events?limit=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].eventType").value("EXPORT"))
                .andExpect(jsonPath("$[0].targetType").value("tickets"));

        verify(service).auditEvents(10);
    }
}
