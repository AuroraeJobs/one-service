package com.one.record.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.one.record.model.LotteryTicketPack;
import com.one.record.model.LotteryTicketPackItem;
import com.one.record.service.ILotteryTicketPackService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryTicketPackControllerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void previewAndApproveTicketPack() throws Exception {
        ILotteryTicketPackService service = mock(ILotteryTicketPackService.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new LotteryTicketPackController(service)).build();
        when(service.preview(any())).thenReturn(pack("DRAFT", "PENDING"));
        when(service.approve("pack-1")).thenReturn(pack("APPROVED", "APPROVED"));

        mockMvc.perform(post("/lottery/ticket-packs/preview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pack("DRAFT", "PENDING"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].blueNumber").value("07"));

        mockMvc.perform(patch("/lottery/ticket-packs/pack-1/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvalState").value("APPROVED"));
    }

    @Test
    void saveAsTicketsReturnsSavedPack() throws Exception {
        ILotteryTicketPackService service = mock(ILotteryTicketPackService.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new LotteryTicketPackController(service)).build();
        LotteryTicketPack saved = pack("SAVED", "APPROVED");
        saved.setSavedTicketIds(List.of("ticket-1"));
        when(service.saveAsTickets("pack-1")).thenReturn(saved);

        mockMvc.perform(post("/lottery/ticket-packs/pack-1/save-tickets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.savedTicketIds[0]").value("ticket-1"));
    }

    private LotteryTicketPack pack(String status, String approvalState) {
        return LotteryTicketPack.builder()
                .id("pack-1")
                .title("票包")
                .targetIssue("2026068")
                .status(status)
                .approvalState(approvalState)
                .items(List.of(LotteryTicketPackItem.builder()
                        .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                        .blueNumber("07")
                        .build()))
                .build();
    }
}
