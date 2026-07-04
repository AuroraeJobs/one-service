package com.one.record.web;

import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryStrategyNoteAttachRequest;
import com.one.record.model.LotteryStrategyNote;
import com.one.record.model.LotteryStrategyNoteEvidence;
import com.one.record.service.ILotteryStrategyNoteService;
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

class LotteryStrategyNoteControllerTest {

    private ILotteryStrategyNoteService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryStrategyNoteService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryStrategyNoteController(service)).build();
    }

    @Test
    void notesDelegatesToService() throws Exception {
        when(service.notes(false, "ACTIVE", 2, 5)).thenReturn(LotteryPageResponse.<LotteryStrategyNote>builder()
                .items(List.of(LotteryStrategyNote.builder().id("note-1").title("假设").build()))
                .page(2)
                .pageSize(5)
                .total(7L)
                .hasNext(true)
                .build());

        mockMvc.perform(get("/lottery/strategy-notes")
                        .param("status", "ACTIVE")
                        .param("page", "2")
                        .param("pageSize", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value("note-1"))
                .andExpect(jsonPath("$.page").value(2))
                .andExpect(jsonPath("$.hasNext").value(true));

        verify(service).notes(false, "ACTIVE", 2, 5);
    }

    @Test
    void createDelegatesToService() throws Exception {
        when(service.create(any(LotteryStrategyNote.class))).thenReturn(LotteryStrategyNote.builder()
                .id("note-1")
                .title("蓝球假设")
                .build());

        mockMvc.perform(post("/lottery/strategy-notes")
                        .contentType("application/json")
                        .content("{\"title\":\"蓝球假设\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("note-1"))
                .andExpect(jsonPath("$.title").value("蓝球假设"));

        verify(service).create(any(LotteryStrategyNote.class));
    }

    @Test
    void updateArchiveAndAttachDelegateToService() throws Exception {
        when(service.update(eq("note-1"), any(LotteryStrategyNote.class))).thenReturn(LotteryStrategyNote.builder().id("note-1").status("ACTIVE").build());
        when(service.archive("note-1")).thenReturn(LotteryStrategyNote.builder().id("note-1").archived(true).build());
        when(service.attachEvidence(eq("note-1"), any(LotteryStrategyNoteAttachRequest.class))).thenReturn(LotteryStrategyNote.builder()
                .id("note-1")
                .evidence(List.of(LotteryStrategyNoteEvidence.builder().evidenceKey("decision:1").build()))
                .build());

        mockMvc.perform(put("/lottery/strategy-notes/note-1")
                        .contentType("application/json")
                        .content("{\"status\":\"active\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        mockMvc.perform(patch("/lottery/strategy-notes/note-1/archive"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archived").value(true));

        mockMvc.perform(post("/lottery/strategy-notes/note-1/evidence")
                        .contentType("application/json")
                        .content("{\"evidence\":{\"evidenceKey\":\"decision:1\"}}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.evidence[0].evidenceKey").value("decision:1"));

        verify(service).update(eq("note-1"), any(LotteryStrategyNote.class));
        verify(service).archive("note-1");
        verify(service).attachEvidence(eq("note-1"), any(LotteryStrategyNoteAttachRequest.class));
    }
}
