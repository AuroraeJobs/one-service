package com.one.record.service.impl;

import com.one.record.lottery.LotteryDataQualityReport;
import com.one.record.lottery.LotteryDataQualityRepairRequest;
import com.one.record.lottery.LotteryDataQualityRepairResult;
import com.one.record.lottery.LotteryStatisticsSummary;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.response.Record;
import com.one.record.service.ILotteryStatisticsService;
import com.one.record.service.IRecordService;
import com.one.record.service.LotteryDrawProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryDataQualityServiceTest {

    private IRecordService recordService;

    private LotteryDrawProvider lotteryDrawProvider;

    private ILotteryStatisticsService statisticsService;

    private LotteryAuditEventRepository auditEventRepository;

    private LotteryDataQualityService service;

    @BeforeEach
    void setUp() {
        recordService = mock(IRecordService.class);
        lotteryDrawProvider = mock(LotteryDrawProvider.class);
        statisticsService = mock(ILotteryStatisticsService.class);
        auditEventRepository = mock(LotteryAuditEventRepository.class);
        when(auditEventRepository.save(any(LotteryAuditEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        service = new LotteryDataQualityService(recordService, lotteryDrawProvider, statisticsService, auditEventRepository);
    }

    @Test
    void reportFindsMissingDuplicateMalformedAndFutureDateIssues() {
        when(recordService.findAll()).thenReturn(List.of(
                record("2026001", "01,02,03,04,05,06", "07", "2026-01-01", 1L),
                record("2026001", "01,02,03,04,05,06", "07", "2026-01-01", 2L),
                record("2026003", "01,02,03,04,05,06", "07", "2026-01-05", 4L),
                record("2026004", "01,02,03,04,05,40", "17", "2026-01-08", 3L),
                record("2026005", "01,02,03,04,05,06", "07", LocalDate.now().plusDays(1).toString(), 5L)
        ));
        when(statisticsService.summary()).thenReturn(LotteryStatisticsSummary.builder()
                .totalDraws(4)
                .latestIssue("2026004")
                .build());

        LotteryDataQualityReport report = service.report();

        assertThat(report.getTotalRecords()).isEqualTo(5);
        assertThat(report.getMissingIssueCount()).isEqualTo(1);
        assertThat(report.getMissingIssues()).containsExactly("2026002");
        assertThat(report.getDuplicateIssueCount()).isEqualTo(1);
        assertThat(report.getDuplicateIssues()).containsExactly("2026001");
        assertThat(report.getMalformedRecordCount()).isEqualTo(1);
        assertThat(report.getInvalidNumberCount()).isEqualTo(1);
        assertThat(report.getMalformedIssues()).containsExactly("2026004");
        assertThat(report.getOutOfOrderLineCount()).isEqualTo(2);
        assertThat(report.getOutOfOrderLineIssues()).containsExactly("2026003", "2026004");
        assertThat(report.getFutureDateCount()).isEqualTo(1);
        assertThat(report.getFutureDateIssues()).containsExactly("2026005");
        assertThat(report.getStaleDerivedDataCount()).isEqualTo(2);
        assertThat(report.getStaleDerivedDataReasons()).hasSize(2);
        assertThat(report.getGeneratedAt()).isNotNull();
    }

    @Test
    void dryRunMissingIssuesRepairReturnsRepairablePlanWithoutSaving() {
        when(recordService.findAll()).thenReturn(List.of(
                record("2026001", "01,02,03,04,05,06", "07", "2026-01-01"),
                record("2026003", "01,02,03,04,05,06", "07", "2026-01-05")
        ));
        when(lotteryDrawProvider.fetchYearlyRecords()).thenReturn(List.of(
                record("2026002", "02,03,04,05,06,07", "08", "2026-01-03")
        ));

        LotteryDataQualityRepairResult result = service.dryRunMissingIssuesRepair(LotteryDataQualityRepairRequest.builder().build());

        assertThat(result.getDryRun()).isTrue();
        assertThat(result.getMissingBefore()).isEqualTo(1);
        assertThat(result.getMissingAfter()).isEqualTo(1);
        assertThat(result.getRequestedIssues()).containsExactly("2026002");
        assertThat(result.getRepairableIssues()).containsExactly("2026002");
        assertThat(result.getRepairedIssueCount()).isZero();
        assertThat(result.getRepairSteps()).anySatisfy(step -> assertThat(step).contains("确认后将插入"));
        assertThat(result.getAuditEventId()).isNotBlank();
        verify(recordService, never()).saveAll(anyList());
        verify(auditEventRepository).save(any(LotteryAuditEvent.class));
    }

    @Test
    void confirmMissingIssuesRepairSavesOnlyProviderBackedRecordsAndReordersLines() {
        when(recordService.findAll()).thenReturn(List.of(
                record("2026001", "01,02,03,04,05,06", "07", "2026-01-01"),
                record("2026003", "01,02,03,04,05,06", "07", "2026-01-05")
        ));
        when(lotteryDrawProvider.fetchYearlyRecords()).thenReturn(List.of(
                record("2026002", "02,03,04,05,06,07", "08", "2026-01-03 21:30:00")
        ));

        LotteryDataQualityRepairResult result = service.confirmMissingIssuesRepair(LotteryDataQualityRepairRequest.builder()
                .confirm(true)
                .build());

        assertThat(result.getDryRun()).isFalse();
        assertThat(result.getMissingBefore()).isEqualTo(1);
        assertThat(result.getMissingAfter()).isZero();
        assertThat(result.getRepairedIssues()).containsExactly("2026002");
        assertThat(result.getInsertedIssueCount()).isEqualTo(1);
        assertThat(result.getRenumberedRecordCount()).isEqualTo(3);
        assertThat(result.getCacheInvalidated()).isTrue();
        assertThat(result.getConfirmed()).isTrue();

        org.mockito.ArgumentCaptor<List<Record>> captor = org.mockito.ArgumentCaptor.captor();
        verify(recordService).saveAll(captor.capture());
        verify(statisticsService).invalidateCache();
        verify(auditEventRepository).save(any(LotteryAuditEvent.class));
        assertThat(captor.getValue()).extracting(Record::getCode).containsExactly("2026001", "2026002", "2026003");
        assertThat(captor.getValue()).extracting(Record::getLine).containsExactly(1L, 2L, 3L);
        assertThat(captor.getValue().get(1).getDate()).isEqualTo("2026-01-03");
    }

    @Test
    void confirmMissingIssuesRepairRequiresExplicitConfirmation() {
        assertThatThrownBy(() -> service.confirmMissingIssuesRepair(LotteryDataQualityRepairRequest.builder().build()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("确认修复缺失期号必须传入 confirm=true");
    }

    @Test
    void dryRunSupportsBoundedIssueRange() {
        when(recordService.findAll()).thenReturn(List.of(
                record("2026001", "01,02,03,04,05,06", "07", "2026-01-01"),
                record("2026005", "01,02,03,04,05,06", "07", "2026-01-10")
        ));
        when(lotteryDrawProvider.fetchYearlyRecords()).thenReturn(List.of(
                record("2026002", "02,03,04,05,06,07", "08", "2026-01-03"),
                record("2026003", "02,03,04,05,06,07", "08", "2026-01-05"),
                record("2026004", "02,03,04,05,06,07", "08", "2026-01-08")
        ));

        LotteryDataQualityRepairResult result = service.dryRunMissingIssuesRepair(LotteryDataQualityRepairRequest.builder()
                .issueStart("2026003")
                .issueEnd("2026004")
                .build());

        assertThat(result.getRequestedIssues()).containsExactly("2026003", "2026004");
        assertThat(result.getRepairableIssues()).containsExactly("2026003", "2026004");
    }

    private Record record(String code, String red, String blue, String date) {
        return record(code, red, blue, date, null);
    }

    private Record record(String code, String red, String blue, String date, Long line) {
        Record record = new Record();
        record.setCode(code);
        record.setRed(red);
        record.setBlue(blue);
        record.setDate(date);
        if (line != null) {
            record.setLine(line);
        }
        return record;
    }
}
