package com.one.record.service.impl;

import com.one.record.lottery.LotteryBacktestRunRequest;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryBacktestReport;
import com.one.record.repository.LotteryBacktestReportRepository;
import com.one.record.response.Record;
import com.one.record.service.IRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LotteryBacktestServiceTest {

    private LotteryBacktestReportRepository repository;

    private IRecordService recordService;

    private LotteryBacktestService service;

    @BeforeEach
    void setUp() {
        repository = mock(LotteryBacktestReportRepository.class);
        recordService = mock(IRecordService.class);
        service = new LotteryBacktestService(repository, recordService);
    }

    @Test
    void runPersistsDurableBacktestReport() {
        when(recordService.findAll()).thenReturn(List.of(
                record("2026001", "01,02,03,04,05,06", "07"),
                record("2026002", "01,02,03,04,05,08", "07"),
                record("2026003", "09,10,11,12,13,14", "01")
        ));
        when(repository.save(any(LotteryBacktestReport.class))).thenAnswer(invocation -> {
            LotteryBacktestReport report = invocation.getArgument(0);
            report.setId("bt-1");
            return report;
        });

        LotteryBacktestReport report = service.run(LotteryBacktestRunRequest.builder()
                .strategyName("上一期基线")
                .presetWindow("latest-30")
                .window(2)
                .build());

        assertThat(report.getId()).isEqualTo("bt-1");
        assertThat(report.getReplayCount()).isEqualTo(2);
        assertThat(report.getRows()).hasSize(2);
        assertThat(report.getRows().get(0).getIssue()).isEqualTo("2026002");
        assertThat(report.getRows().get(0).getRedHits()).isEqualTo(5);
        assertThat(report.getRows().get(0).getBlueHit()).isTrue();
        assertThat(report.getPrizeDistribution()).containsKey("三等奖");
        assertThat(report.getBankrollSimulation()).hasSize(2);
        assertThat(report.getAuditMetadata().getAction()).isEqualTo("backtest-run");
        assertThat(report.getCreatedAt()).isNotNull();
    }

    @Test
    void reportsFiltersAndPages() {
        when(repository.findAll(any(Sort.class))).thenReturn(List.of(
                report("bt-1", "上一期基线", "latest-30", 100L),
                report("bt-2", "深度回测", "latest-100", 200L),
                report("bt-3", "上一期基线", "latest-30", 300L)
        ));

        LotteryPageResponse<LotteryBacktestReport> page = service.reports(0, 1, "基线", "latest-30", 50L, 350L);

        assertThat(page.getTotal()).isEqualTo(2);
        assertThat(page.getItems()).extracting("id").containsExactly("bt-1");
        assertThat(page.getHasNext()).isTrue();
    }

    @Test
    void detailReturnsRepositoryRecord() {
        LotteryBacktestReport report = report("bt-1", "上一期基线", "latest-30", 100L);
        when(repository.findById("bt-1")).thenReturn(Optional.of(report));

        assertThat(service.detail("bt-1")).isSameAs(report);
        assertThat(service.detail(" ")).isNull();
    }

    private static Record record(String issue, String red, String blue) {
        Record record = new Record();
        record.setCode(issue);
        record.setDate("2026-01-01");
        record.setRed(red);
        record.setBlue(blue);
        return record;
    }

    private static LotteryBacktestReport report(String id, String strategyName, String presetWindow, long createdAt) {
        return LotteryBacktestReport.builder()
                .id(id)
                .strategyName(strategyName)
                .presetWindow(presetWindow)
                .createdAt(createdAt)
                .build();
    }
}
