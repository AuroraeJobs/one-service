package com.one.record.service.impl;

import com.one.record.lottery.LotteryDataQualityReport;
import com.one.record.response.Record;
import com.one.record.service.IRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LotteryDataQualityServiceTest {

    private IRecordService recordService;

    private LotteryDataQualityService service;

    @BeforeEach
    void setUp() {
        recordService = mock(IRecordService.class);
        service = new LotteryDataQualityService(recordService);
    }

    @Test
    void reportFindsMissingDuplicateMalformedAndFutureDateIssues() {
        when(recordService.findAll()).thenReturn(List.of(
                record("2026001", "01,02,03,04,05,06", "07", "2026-01-01"),
                record("2026001", "01,02,03,04,05,06", "07", "2026-01-01"),
                record("2026003", "01,02,03,04,05,06", "07", "2026-01-05"),
                record("2026004", "01,02,03,04,05,40", "17", "2026-01-08"),
                record("2026005", "01,02,03,04,05,06", "07", LocalDate.now().plusDays(1).toString())
        ));

        LotteryDataQualityReport report = service.report();

        assertThat(report.getTotalRecords()).isEqualTo(5);
        assertThat(report.getMissingIssueCount()).isEqualTo(1);
        assertThat(report.getMissingIssues()).containsExactly("2026002");
        assertThat(report.getDuplicateIssueCount()).isEqualTo(1);
        assertThat(report.getDuplicateIssues()).containsExactly("2026001");
        assertThat(report.getMalformedRecordCount()).isEqualTo(1);
        assertThat(report.getMalformedIssues()).containsExactly("2026004");
        assertThat(report.getFutureDateCount()).isEqualTo(1);
        assertThat(report.getFutureDateIssues()).containsExactly("2026005");
        assertThat(report.getGeneratedAt()).isNotNull();
    }

    private Record record(String code, String red, String blue, String date) {
        Record record = new Record();
        record.setCode(code);
        record.setRed(red);
        record.setBlue(blue);
        record.setDate(date);
        return record;
    }
}
