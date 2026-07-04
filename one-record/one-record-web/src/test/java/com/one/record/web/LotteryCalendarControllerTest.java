package com.one.record.web;

import com.one.record.lottery.LotteryCalendarState;
import com.one.record.lottery.LotteryReminderAcknowledgeRequest;
import com.one.record.service.ILotteryCalendarService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryCalendarControllerTest {

    private ILotteryCalendarService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryCalendarService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryCalendarController(service)).build();
    }

    @Test
    void calendarDelegatesToService() throws Exception {
        when(service.calendar()).thenReturn(calendar());

        mockMvc.perform(get("/lottery/calendar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nextIssue").value("2026079"))
                .andExpect(jsonPath("$.nextDrawDate").value("2026-07-05"))
                .andExpect(jsonPath("$.reminders[0].key").value("tickets"));

        verify(service).calendar();
    }

    @Test
    void acknowledgeDelegatesToService() throws Exception {
        when(service.acknowledge(eq("tickets"), org.mockito.ArgumentMatchers.any(LotteryReminderAcknowledgeRequest.class)))
                .thenReturn(calendar());

        mockMvc.perform(post("/lottery/alerts/tickets/ack")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fingerprint\":\"tickets|PENDING|/lottery/tickets?issue=2026079|1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nextIssue").value("2026079"));

        verify(service).acknowledge(eq("tickets"), org.mockito.ArgumentMatchers.any(LotteryReminderAcknowledgeRequest.class));
    }

    private static LotteryCalendarState calendar() {
        return LotteryCalendarState.builder()
                .latestIssue("2026078")
                .nextIssue("2026079")
                .nextDrawDate("2026-07-05")
                .drawWeekday("周日")
                .reminders(List.of(LotteryCalendarState.Reminder.builder()
                        .key("tickets")
                        .label("票据提醒")
                        .fingerprint("tickets|PENDING|/lottery/tickets?issue=2026079|1")
                        .build()))
                .generatedAt(100L)
                .build();
    }
}
