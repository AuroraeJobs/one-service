package com.one.record.web;

import com.one.record.request.RecordRequest;
import com.one.record.model.LotteryRecordSyncLog;
import com.one.record.response.Record;
import com.one.record.response.RecordYearCount;
import com.one.record.service.ILotteryRecordSyncLogService;
import com.one.record.service.IRecordService;
import com.one.record.service.IRecordUpdate;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LotteryRecordControllerTest {

    private IRecordService recordService;

    private IRecordUpdate recordUpdate;

    private ILotteryRecordSyncLogService syncLogService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        recordService = mock(IRecordService.class);
        recordUpdate = mock(IRecordUpdate.class);
        syncLogService = mock(ILotteryRecordSyncLogService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryRecordController(recordService, recordUpdate, syncLogService)).build();
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
        verifyNoInteractions(recordUpdate);
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
    void yearlyCountsUsesExistingCacheService() throws Exception {
        when(recordService.getYearCounts()).thenReturn(List.of(new RecordYearCount("2026", 151)));

        mockMvc.perform(get("/lottery/records/yearly-counts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].year").value("2026"))
                .andExpect(jsonPath("$[0].count").value(151));
    }

    @Test
    void syncTriggersExistingRecordUpdateFlow() throws Exception {
        Record before = new Record();
        before.setCode("2026001");
        before.setLine(1);
        Record after = new Record();
        after.setCode("2026003");
        after.setLine(3);
        LotteryRecordSyncLog running = LotteryRecordSyncLog.builder()
                .id("sync-1")
                .status("RUNNING")
                .build();
        LotteryRecordSyncLog success = LotteryRecordSyncLog.builder()
                .id("sync-1")
                .status("SUCCESS")
                .endIssue("2026003")
                .savedCount(2)
                .build();
        when(recordService.findLast()).thenReturn(before, after);
        when(syncLogService.start("manual-record-sync", "2026001")).thenReturn(running);
        when(syncLogService.success(running, "2026003", 2, "新增 2 期开奖记录")).thenReturn(success);

        mockMvc.perform(post("/lottery/records/sync"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.savedCount").value(2));

        verify(recordUpdate).update();
        verify(syncLogService).success(running, "2026003", 2, "新增 2 期开奖记录");
    }

    @Test
    void syncRecordsFailureLogAndRethrows() throws Exception {
        Record before = new Record();
        before.setCode("2026001");
        LotteryRecordSyncLog running = LotteryRecordSyncLog.builder()
                .id("sync-1")
                .status("RUNNING")
                .build();
        when(recordService.findLast()).thenReturn(before);
        when(syncLogService.start("manual-record-sync", "2026001")).thenReturn(running);
        doThrow(new IllegalStateException("provider unavailable")).when(recordUpdate).update();

        assertThrows(ServletException.class, () -> mockMvc.perform(post("/lottery/records/sync")));

        verify(syncLogService).failure(running, "provider unavailable");
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
