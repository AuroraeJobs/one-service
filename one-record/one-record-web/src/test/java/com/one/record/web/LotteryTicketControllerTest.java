package com.one.record.web;

import com.one.record.model.LotteryTicket;
import com.one.record.service.ILotteryTicketService;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryTicketBudgetPrecheckResult;
import com.one.record.lottery.LotteryTicketBatchSaveResult;
import com.one.record.lottery.LotteryTicketBulkOperationResult;
import com.one.record.lottery.LotteryTicketImportPreviewResult;
import com.one.record.lottery.LotteryTicketImportPreviewRow;
import com.one.record.lottery.LotteryTicketPrizeCheckSummary;
import com.one.record.lottery.LotteryTicketSummary;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryTicketControllerTest {

    private ILotteryTicketService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryTicketService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryTicketController(service)).build();
    }

    @Test
    void ticketsBindsIssueFilter() throws Exception {
        when(service.tickets("2026001", "CHECKED", "PREDICTION", "FIFTH", "snapshot-1")).thenReturn(List.of(LotteryTicket.builder()
                .id("ticket-1")
                .issue("2026001")
                .blueNumber("07")
                .build()));

        mockMvc.perform(get("/lottery/tickets")
                        .param("issue", "2026001")
                        .param("status", "CHECKED")
                        .param("source", "PREDICTION")
                        .param("prizeGrade", "FIFTH")
                        .param("predictionSnapshotId", "snapshot-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("ticket-1"))
                .andExpect(jsonPath("$[0].blueNumber").value("07"));

        verify(service).tickets("2026001", "CHECKED", "PREDICTION", "FIFTH", "snapshot-1");
    }

    @Test
    void ticketsPageBindsFilters() throws Exception {
        when(service.ticketsPage("2026001", "CHECKED", "PREDICTION", "FIFTH", "snapshot-1", 100L, 200L, 1, 10))
                .thenReturn(LotteryPageResponse.<LotteryTicket>builder()
                        .items(List.of(LotteryTicket.builder().id("ticket-1").issue("2026001").build()))
                        .page(1)
                        .pageSize(10)
                        .total(12L)
                        .hasNext(true)
                        .build());

        mockMvc.perform(get("/lottery/tickets")
                        .param("page", "1")
                        .param("pageSize", "10")
                        .param("issue", "2026001")
                        .param("status", "CHECKED")
                        .param("source", "PREDICTION")
                        .param("prizeGrade", "FIFTH")
                        .param("predictionSnapshotId", "snapshot-1")
                        .param("createdStartAt", "100")
                        .param("createdEndAt", "200"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value("ticket-1"))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.pageSize").value(10))
                .andExpect(jsonPath("$.total").value(12))
                .andExpect(jsonPath("$.hasNext").value(true));

        verify(service).ticketsPage("2026001", "CHECKED", "PREDICTION", "FIFTH", "snapshot-1", 100L, 200L, 1, 10);
    }

    @Test
    void saveTicketDelegatesToService() throws Exception {
        when(service.saveTicket(org.mockito.ArgumentMatchers.any(LotteryTicket.class)))
                .thenReturn(LotteryTicket.builder().id("ticket-1").issue("2026001").build());

        mockMvc.perform(post("/lottery/tickets")
                        .contentType("application/json")
                        .content("{\"issue\":\"2026001\",\"redNumbers\":[\"01\",\"02\",\"03\",\"04\",\"05\",\"06\"],\"blueNumber\":\"07\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("ticket-1"));

        verify(service).saveTicket(org.mockito.ArgumentMatchers.any(LotteryTicket.class));
    }

    @Test
    void saveTicketsDelegatesToService() throws Exception {
        when(service.saveTickets(org.mockito.ArgumentMatchers.any()))
                .thenReturn(LotteryTicketBatchSaveResult.builder()
                        .requestedCount(2)
                        .savedCount(1)
                        .duplicateCount(1)
                        .savedTickets(List.of(LotteryTicket.builder().id("ticket-1").issue("2026001").build()))
                        .build());

        mockMvc.perform(post("/lottery/tickets/batch")
                        .contentType("application/json")
                        .content("{\"tickets\":[{\"issue\":\"2026001\",\"redNumbers\":[\"01\",\"02\",\"03\",\"04\",\"05\",\"06\"],\"blueNumber\":\"07\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestedCount").value(2))
                .andExpect(jsonPath("$.savedCount").value(1))
                .andExpect(jsonPath("$.duplicateCount").value(1))
                .andExpect(jsonPath("$.savedTickets[0].id").value("ticket-1"));

        verify(service).saveTickets(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void importPreviewDelegatesToService() throws Exception {
        when(service.importPreview(org.mockito.ArgumentMatchers.any())).thenReturn(LotteryTicketImportPreviewResult.builder()
                .requestedCount(1)
                .validCount(1)
                .rows(List.of(LotteryTicketImportPreviewRow.builder()
                        .lineNumber(1)
                        .status("VALID")
                        .ticket(LotteryTicket.builder().issue("2026001").build())
                        .build()))
                .build());

        mockMvc.perform(post("/lottery/tickets/import/preview")
                        .contentType("application/json")
                        .content("{\"content\":\"2026001 01 02 03 04 05 06 07\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestedCount").value(1))
                .andExpect(jsonPath("$.validCount").value(1))
                .andExpect(jsonPath("$.rows[0].status").value("VALID"));

        verify(service).importPreview(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void budgetPrecheckDelegatesToService() throws Exception {
        when(service.budgetPrecheck(org.mockito.ArgumentMatchers.any())).thenReturn(LotteryTicketBudgetPrecheckResult.builder()
                .requestedCount(1)
                .proposedTicketCount(1)
                .status("WARNING")
                .build());

        mockMvc.perform(post("/lottery/tickets/budget/precheck")
                        .contentType("application/json")
                        .content("{\"tickets\":[{\"issue\":\"2026001\",\"redNumbers\":[\"01\",\"02\",\"03\",\"04\",\"05\",\"06\"],\"blueNumber\":\"07\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestedCount").value(1))
                .andExpect(jsonPath("$.status").value("WARNING"));

        verify(service).budgetPrecheck(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void updateTicketDelegatesToService() throws Exception {
        when(service.updateTicket(org.mockito.ArgumentMatchers.eq("ticket-1"), org.mockito.ArgumentMatchers.any(LotteryTicket.class)))
                .thenReturn(LotteryTicket.builder().id("ticket-1").status("BOUGHT").build());

        mockMvc.perform(put("/lottery/tickets/ticket-1")
                        .contentType("application/json")
                        .content("{\"status\":\"BOUGHT\",\"redNumbers\":[\"01\",\"02\",\"03\",\"04\",\"05\",\"06\"],\"blueNumber\":\"07\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("BOUGHT"));

        verify(service).updateTicket(org.mockito.ArgumentMatchers.eq("ticket-1"), org.mockito.ArgumentMatchers.any(LotteryTicket.class));
    }

    @Test
    void bulkUpdateTicketsDelegatesToService() throws Exception {
        when(service.bulkUpdateTickets(org.mockito.ArgumentMatchers.any())).thenReturn(LotteryTicketBulkOperationResult.builder()
                .requestedCount(2)
                .updatedCount(2)
                .tickets(List.of(LotteryTicket.builder().id("ticket-1").status("BOUGHT").build()))
                .build());

        mockMvc.perform(patch("/lottery/tickets/bulk")
                        .contentType("application/json")
                        .content("{\"ids\":[\"ticket-1\",\"ticket-2\"],\"status\":\"BOUGHT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestedCount").value(2))
                .andExpect(jsonPath("$.updatedCount").value(2))
                .andExpect(jsonPath("$.tickets[0].status").value("BOUGHT"));

        verify(service).bulkUpdateTickets(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void archiveTicketsDelegatesToService() throws Exception {
        when(service.archiveTickets(org.mockito.ArgumentMatchers.any())).thenReturn(LotteryTicketBulkOperationResult.builder()
                .requestedCount(1)
                .updatedCount(1)
                .archivedCount(1)
                .build());

        mockMvc.perform(patch("/lottery/tickets/bulk/archive")
                        .contentType("application/json")
                        .content("{\"ids\":[\"ticket-1\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedCount").value(1));

        verify(service).archiveTickets(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void deleteTicketDelegatesToService() throws Exception {
        mockMvc.perform(delete("/lottery/tickets/ticket-1"))
                .andExpect(status().isOk());

        verify(service).deleteTicket("ticket-1");
    }

    @Test
    void deleteTicketsDelegatesToService() throws Exception {
        when(service.deleteTickets(org.mockito.ArgumentMatchers.any())).thenReturn(LotteryTicketBulkOperationResult.builder()
                .requestedCount(2)
                .deletedCount(1)
                .missingIds(List.of("missing"))
                .build());

        mockMvc.perform(post("/lottery/tickets/bulk/delete")
                        .contentType("application/json")
                        .content("{\"ids\":[\"ticket-1\",\"missing\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestedCount").value(2))
                .andExpect(jsonPath("$.deletedCount").value(1))
                .andExpect(jsonPath("$.missingIds[0]").value("missing"));

        verify(service).deleteTickets(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void summaryDelegatesToService() throws Exception {
        when(service.summary()).thenReturn(LotteryTicketSummary.builder()
                .ticketCount(2)
                .winningTicketCount(1)
                .totalPrizeAmount(1000L)
                .build());

        mockMvc.perform(get("/lottery/tickets/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticketCount").value(2))
                .andExpect(jsonPath("$.winningTicketCount").value(1))
                .andExpect(jsonPath("$.totalPrizeAmount").value(1000));

        verify(service).summary();
    }

    @Test
    void checkPrizesDelegatesToService() throws Exception {
        when(service.checkPrizes(org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of(LotteryTicket.builder()
                        .id("ticket-1")
                        .prizeGrade("FIFTH")
                        .status("CHECKED")
                        .build()));

        mockMvc.perform(post("/lottery/tickets/check-prizes")
                        .contentType("application/json")
                        .content("{\"period\":2026001,\"redNumbers\":[\"01\",\"02\",\"03\",\"04\",\"05\",\"06\"],\"blueNumber\":\"07\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("ticket-1"))
                .andExpect(jsonPath("$[0].prizeGrade").value("FIFTH"))
                .andExpect(jsonPath("$[0].status").value("CHECKED"));

        verify(service).checkPrizes(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void checkLatestPrizesDelegatesToService() throws Exception {
        when(service.checkLatestPrizes()).thenReturn(LotteryTicketPrizeCheckSummary.builder()
                .issue("2026001")
                .checkedTicketCount(2)
                .winningTicketCount(1)
                .totalPrizeAmount(1000L)
                .build());

        mockMvc.perform(post("/lottery/tickets/check-prizes/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.issue").value("2026001"))
                .andExpect(jsonPath("$.checkedTicketCount").value(2))
                .andExpect(jsonPath("$.winningTicketCount").value(1))
                .andExpect(jsonPath("$.totalPrizeAmount").value(1000));

        verify(service).checkLatestPrizes();
    }
}
