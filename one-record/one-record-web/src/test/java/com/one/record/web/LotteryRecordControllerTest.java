package com.one.record.web;

import com.one.record.request.RecordRequest;
import com.one.record.response.Record;
import com.one.record.response.RecordYearCount;
import com.one.record.service.IRecordService;
import com.one.record.service.IRecordUpdate;
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

    private IRecordUpdate recordUpdate;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        recordService = mock(IRecordService.class);
        recordUpdate = mock(IRecordUpdate.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new LotteryRecordController(recordService, recordUpdate)).build();
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
        mockMvc.perform(post("/lottery/records/sync"))
                .andExpect(status().isOk());

        verify(recordUpdate).update();
    }
}
