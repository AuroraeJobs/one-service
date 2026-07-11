package com.one.record.service.impl;

import com.one.record.lottery.LotteryBacktestRunRequest;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryResearchProvenance;
import com.one.record.model.LotteryBacktestReport;
import com.one.record.model.LotteryDecisionCandidateSelection;
import com.one.record.model.LotteryDecisionSet;
import com.one.record.repository.LotteryBacktestReportRepository;
import com.one.record.repository.LotteryDecisionSetRepository;
import com.one.record.response.Record;
import com.one.record.service.IRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LotteryBacktestServiceTest {

    private LotteryBacktestReportRepository repository;

    private LotteryDecisionSetRepository decisionSetRepository;

    private IRecordService recordService;

    private LotteryBacktestService service;

    @BeforeEach
    void setUp() {
        repository = mock(LotteryBacktestReportRepository.class);
        decisionSetRepository = mock(LotteryDecisionSetRepository.class);
        recordService = mock(IRecordService.class);
        service = new LotteryBacktestService(repository, decisionSetRepository, recordService);
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
        assertThat(report.getBaselineSeed()).isEqualTo(42L);
        assertThat(report.getBaselineRows()).hasSize(2);
        assertThat(report.getSameWindow()).isTrue();
        assertThat(report.getSameBudget()).isTrue();
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

    @Test
    void decisionBacktestUsesExactWindowAndDeterministicSameBudgetRandomSlots() {
        List<Record> records = IntStream.rangeClosed(1, 35)
                .mapToObj(index -> record(String.format("2026%03d", index), "01,02,03,04,05,06", "01"))
                .toList();
        LotteryResearchProvenance provenance = LotteryResearchProvenance.builder()
                .sourceType("MINIGPT")
                .batchId("batch-1")
                .runId("run-1")
                .trainFirstIssue("2026001")
                .trainLatestIssue("2026010")
                .validationFirstIssue("2026011")
                .validationLatestIssue("2026035")
                .build();
        LotteryDecisionSet decisionSet = LotteryDecisionSet.builder()
                .id("decision-1")
                .provenance(provenance)
                .selectedCandidates(List.of(
                        candidate("generation-1", List.of("01", "02", "03", "04", "05", "06"), "01"),
                        candidate("generation-2", List.of("07", "08", "09", "10", "11", "12"), "02"),
                        candidate("generation-3", List.of("13", "14", "15", "16", "17", "18"), "03")
                ))
                .build();
        when(recordService.findAll()).thenReturn(records);
        when(decisionSetRepository.findById("decision-1")).thenReturn(Optional.of(decisionSet));
        when(repository.save(any(LotteryBacktestReport.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LotteryBacktestRunRequest request = LotteryBacktestRunRequest.builder()
                .decisionSetId("decision-1")
                .strategyName("MiniGPT:run-1")
                .presetWindow("latest-30")
                .window(30)
                .baselineSeed(77L)
                .build();
        LotteryBacktestReport first = service.run(request);
        LotteryBacktestReport repeated = service.run(request);

        assertThat(first.getIssueStart()).isEqualTo("2026006");
        assertThat(first.getIssueEnd()).isEqualTo("2026035");
        assertThat(first.getWindowIssueCount()).isEqualTo(30);
        assertThat(first.getCandidateCount()).isEqualTo(3);
        assertThat(first.getUniqueCandidateCount()).isEqualTo(3);
        assertThat(first.getTicketCount()).isEqualTo(90);
        assertThat(first.getBaselineTicketCount()).isEqualTo(90);
        assertThat(first.getTotalCost()).isEqualByComparingTo("180");
        assertThat(first.getBaselineTotalCost()).isEqualByComparingTo("180");
        assertThat(first.getSameWindow()).isTrue();
        assertThat(first.getSameBudget()).isTrue();
        assertThat(first.getCandidateDiversity()).isEqualByComparingTo("100.00");
        assertThat(first.getMaxRedOverlap()).isZero();
        assertThat(first.getDistinctBlueCount()).isEqualTo(3);
        assertThat(first.getEvaluationMode()).isEqualTo("STATIC_POOL_HISTORICAL_REPLAY");
        assertThat(first.getOverfitWarnings()).contains(
                "STATIC_POOL_HISTORICAL_REPLAY",
                "TRAIN_WINDOW_OVERLAP",
                "VALIDATION_WINDOW_OVERLAP"
        );
        List<LotteryBacktestReport.ReplayRow> firstIssueBaseline = first.getBaselineRows().stream()
                .filter(row -> "2026006".equals(row.getIssue()))
                .toList();
        assertThat(firstIssueBaseline).hasSize(3);
        assertThat(firstIssueBaseline)
                .extracting(row -> String.join("-", row.getPredictedRedNumbers()) + "+" + row.getPredictedBlueNumber())
                .doesNotHaveDuplicates();
        assertThat(repeated.getBaselineRows())
                .extracting(row -> row.getSeed() + ":" + row.getPredictedRedNumbers() + ":" + row.getPredictedBlueNumber())
                .containsExactlyElementsOf(first.getBaselineRows().stream()
                        .map(row -> row.getSeed() + ":" + row.getPredictedRedNumbers() + ":" + row.getPredictedBlueNumber())
                        .toList());
        assertThat(first.getProvenance()).isNotSameAs(provenance);
        assertThat(first.getProvenance().getBatchId()).isEqualTo("batch-1");
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

    private static LotteryDecisionCandidateSelection candidate(String generationId,
                                                                List<String> redNumbers,
                                                                String blueNumber) {
        return LotteryDecisionCandidateSelection.builder()
                .key(generationId)
                .generationId(generationId)
                .source("MINIGPT")
                .redNumbers(redNumbers)
                .blueNumber(blueNumber)
                .build();
    }
}
