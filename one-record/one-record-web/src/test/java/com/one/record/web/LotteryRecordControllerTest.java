package com.one.record.web;

import com.one.record.lottery.LotteryDraw;
import com.one.record.request.RecordRequest;
import com.one.record.model.LotteryRecordSyncLog;
import com.one.record.response.Record;
import com.one.record.response.RecordYearCount;
import com.one.record.service.ILotteryRecordSyncLogService;
import com.one.record.service.ILotteryRecordSyncService;
import com.one.record.service.IRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryRecordControllerTest {

    private IRecordService recordService;

    private ILotteryRecordSyncLogService syncLogService;

    private ILotteryRecordSyncService syncService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        recordService = mock(IRecordService.class);
        syncLogService = mock(ILotteryRecordSyncLogService.class);
        syncService = mock(ILotteryRecordSyncService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryRecordController(recordService, syncLogService, syncService)).build();
    }

    @Test
    void latestUsesExistingRecordService() throws Exception {
        Record record = new Record();
        record.setCode("2026001");
        record.setRed("01,02,03,04,05,06");
        record.setBlue("07");
        when(recordService.findLast()).thenReturn(record);

        mockMvc.perform(get("/lottery/records/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("2026001"))
                .andExpect(jsonPath("$.blue").value("07"));

        verify(recordService).findLast();
        verifyNoInteractions(syncService);
    }

    @Test
    void recordsWithoutFiltersReturnsAllRecords() throws Exception {
        Record record = new Record();
        record.setCode("2026001");
        when(recordService.findAll()).thenReturn(List.of(record));

        mockMvc.perform(get("/lottery/records"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("2026001"));

        verify(recordService).findAll();
    }

    @Test
    void recordsBindsIssueFilterToRecordRequest() throws Exception {
        when(recordService.find(org.mockito.ArgumentMatchers.any(RecordRequest.class))).thenReturn(List.of());

        mockMvc.perform(get("/lottery/records")
                        .param("issueStart", "2026001")
                        .param("issueEnd", "2026005"))
                .andExpect(status().isOk());

        ArgumentCaptor<RecordRequest> requestCaptor = ArgumentCaptor.captor();
        verify(recordService).find(requestCaptor.capture());
        assertThat(requestCaptor.getValue().getIssueStart()).isEqualTo("2026001");
        assertThat(requestCaptor.getValue().getIssueEnd()).isEqualTo("2026005");
    }

    @Test
    void latestDrawUsesNormalizedRecordService() throws Exception {
        when(recordService.findLastDraw()).thenReturn(LotteryDraw.builder()
                .issue("2026001")
                .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                .blueNumber("07")
                .build());

        mockMvc.perform(get("/lottery/records/draws/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.issue").value("2026001"))
                .andExpect(jsonPath("$.redNumbers[0]").value("01"))
                .andExpect(jsonPath("$.blueNumber").value("07"));

        verify(recordService).findLastDraw();
    }

    @Test
    void drawsBindsFiltersAndPagination() throws Exception {
        when(recordService.findDraws(org.mockito.ArgumentMatchers.any(RecordRequest.class), org.mockito.ArgumentMatchers.eq(2),
                org.mockito.ArgumentMatchers.eq(20))).thenReturn(List.of(
                LotteryDraw.builder()
                        .issue("2026005")
                        .blueNumber("16")
                        .build()
        ));

        mockMvc.perform(get("/lottery/records/draws")
                        .param("issueStart", "2026001")
                        .param("issueEnd", "2026005")
                        .param("page", "2")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].issue").value("2026005"))
                .andExpect(jsonPath("$[0].blueNumber").value("16"));

        ArgumentCaptor<RecordRequest> requestCaptor = ArgumentCaptor.captor();
        verify(recordService).findDraws(requestCaptor.capture(), org.mockito.ArgumentMatchers.eq(2), org.mockito.ArgumentMatchers.eq(20));
        assertThat(requestCaptor.getValue().getIssueStart()).isEqualTo("2026001");
        assertThat(requestCaptor.getValue().getIssueEnd()).isEqualTo("2026005");
    }

    @Test
    void yearlyCountsUsesExistingCacheService() throws Exception {
        when(recordService.getYearCounts()).thenReturn(List.of(new RecordYearCount("2026", 151)));

        mockMvc.perform(get("/lottery/records/yearly-counts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].year").value("2026"))
                .andExpect(jsonPath("$[0].count").value(151));
    }

    @Test
    void syncDelegatesToSyncService() throws Exception {
        LotteryRecordSyncLog success = LotteryRecordSyncLog.builder()
                .id("sync-1")
                .status("SUCCESS")
                .endIssue("2026003")
                .savedCount(2)
                .build();
        when(syncService.syncManually()).thenReturn(success);

        mockMvc.perform(post("/lottery/records/sync"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.savedCount").value(2));

        verify(syncService).syncManually();
    }

    @Test
    void retrySyncDelegatesToManualSyncService() throws Exception {
        when(syncService.syncManually()).thenReturn(LotteryRecordSyncLog.builder()
                .status("SUCCESS")
                .savedCount(1)
                .build());

        mockMvc.perform(post("/lottery/records/sync/retry"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.savedCount").value(1));

        verify(syncService).syncManually();
    }

    @Test
    void scheduledSyncDelegatesToScheduledSyncService() throws Exception {
        when(syncService.syncScheduled()).thenReturn(LotteryRecordSyncLog.builder()
                .status("SKIPPED")
                .message("running")
                .build());

        mockMvc.perform(post("/lottery/records/sync/scheduled"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SKIPPED"))
                .andExpect(jsonPath("$.message").value("running"));

        verify(syncService).syncScheduled();
    }

    @Test
    void syncLogsBindsStatusAndLimit() throws Exception {
        when(syncLogService.findRecent("SUCCESS", 20)).thenReturn(List.of(
                LotteryRecordSyncLog.builder()
                        .id("sync-1")
                        .status("SUCCESS")
                        .savedCount(3)
                        .build()
        ));

        mockMvc.perform(get("/lottery/records/sync-logs")
                        .param("status", "SUCCESS")
                        .param("limit", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("SUCCESS"))
                .andExpect(jsonPath("$[0].savedCount").value(3));

        verify(syncLogService).findRecent("SUCCESS", 20);
    }
}
