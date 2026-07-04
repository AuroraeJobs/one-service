package com.one.record.web;

import com.one.record.lottery.LotteryReminderItem;
import com.one.record.lottery.LotteryReminderSummary;
import com.one.record.service.ILotteryReminderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryReminderControllerTest {

    private ILotteryReminderService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ILotteryReminderService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryReminderController(service)).build();
    }

    @Test
    void summaryDelegatesToService() throws Exception {
        when(service.summary()).thenReturn(LotteryReminderSummary.builder()
                .activeCount(1)
                .dueCount(1)
                .items(List.of(LotteryReminderItem.builder()
                        .key("data-quality")
                        .title("数据质量待修复")
                        .status("WARNING")
                        .build()))
                .build());

        mockMvc.perform(get("/lottery/reminders/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeCount").value(1))
                .andExpect(jsonPath("$.items[0].key").value("data-quality"));

        verify(service).summary();
    }

    @Test
    void acknowledgeAndSnoozeDelegateToService() throws Exception {
        when(service.acknowledge(any(), any())).thenReturn(LotteryReminderSummary.builder().activeCount(0).items(List.of()).build());
        when(service.snooze(any(), any())).thenReturn(LotteryReminderSummary.builder().snoozedCount(1).items(List.of()).build());

        mockMvc.perform(post("/lottery/reminders/data-quality/ack")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fingerprint\":\"data-quality|1\",\"note\":\"done\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeCount").value(0));
        mockMvc.perform(post("/lottery/reminders/data-quality/snooze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fingerprint\":\"data-quality|1\",\"snoozeMinutes\":30}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.snoozedCount").value(1));

        verify(service).acknowledge(any(), any());
        verify(service).snooze(any(), any());
    }
}
