package com.one.record.web;

import com.one.record.model.LotteryTicket;
import com.one.record.service.ILotteryTicketService;
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
        when(service.tickets("2026001")).thenReturn(List.of(LotteryTicket.builder()
                .id("ticket-1")
                .issue("2026001")
                .blueNumber("07")
                .build()));

        mockMvc.perform(get("/lottery/tickets").param("issue", "2026001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("ticket-1"))
                .andExpect(jsonPath("$[0].blueNumber").value("07"));

        verify(service).tickets("2026001");
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
    void deleteTicketDelegatesToService() throws Exception {
        mockMvc.perform(delete("/lottery/tickets/ticket-1"))
                .andExpect(status().isOk());

        verify(service).deleteTicket("ticket-1");
    }
}
