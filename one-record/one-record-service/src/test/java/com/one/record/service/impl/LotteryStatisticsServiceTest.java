package com.one.record.service.impl;

import com.one.record.lottery.LotteryDraw;
import com.one.record.lottery.LotteryStatisticsSummary;
import com.one.record.request.RecordRequest;
import com.one.record.service.IRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryStatisticsServiceTest {

    private IRecordService recordService;

    private LotteryStatisticsService service;

    @BeforeEach
    void setUp() {
        recordService = mock(IRecordService.class);
        service = new LotteryStatisticsService(recordService);
    }

    @Test
    void summaryCalculatesFrequencyAndDistributionFromDraws() {
        LotteryDraw first = draw("2026001", "2026-01-01", List.of("01", "02", "03", "04", "05", "06"), "07");
        LotteryDraw second = draw("2026002", "2026-01-03", List.of("01", "08", "09", "10", "11", "13"), "07");
        when(recordService.findFirstDraw()).thenReturn(first);
        when(recordService.findLastDraw()).thenReturn(second);
        when(recordService.findDraws(any(RecordRequest.class), eq(0), eq(500))).thenReturn(List.of(second, first));

        LotteryStatisticsSummary summary = service.summary();

        assertThat(summary.getTotalDraws()).isEqualTo(2);
        assertThat(summary.getFirstIssue()).isEqualTo("2026001");
        assertThat(summary.getLatestIssue()).isEqualTo("2026002");
        assertThat(summary.getRedFrequency().get(0).getNumber()).isEqualTo("01");
        assertThat(summary.getRedFrequency().get(0).getCount()).isEqualTo(2);
        assertThat(summary.getRedFrequency().get(0).getPercent()).isEqualTo(16.7);
        assertThat(summary.getBlueFrequency().get(0).getNumber()).isEqualTo("07");
        assertThat(summary.getBlueFrequency().get(0).getCount()).isEqualTo(2);
        assertThat(summary.getOddCountDistribution()).extracting("value").containsExactly("3", "4");
        assertThat(summary.getBigCountDistribution()).extracting("value").containsExactly("0");
        assertThat(summary.getGeneratedAt()).isNotNull();
        verify(recordService).findDraws(any(RecordRequest.class), eq(0), eq(500));
    }

    @Test
    void frequencyReturnsRedAndBlueBuckets() {
        when(recordService.findFirstDraw()).thenReturn(null);
        when(recordService.findLastDraw()).thenReturn(null);
        when(recordService.findDraws(any(RecordRequest.class), eq(0), eq(500))).thenReturn(List.of(
                draw("2026001", "2026-01-01", List.of("01", "02", "03", "04", "05", "06"), "07")
        ));

        assertThat(service.frequency())
                .containsKeys("red", "blue")
                .satisfies(result -> {
                    assertThat(result.get("red")).hasSize(33);
                    assertThat(result.get("blue")).hasSize(16);
                });
    }

    @Test
    void distributionReturnsStructureBuckets() {
        when(recordService.findFirstDraw()).thenReturn(null);
        when(recordService.findLastDraw()).thenReturn(null);
        when(recordService.findDraws(any(RecordRequest.class), eq(0), eq(500))).thenReturn(List.of(
                draw("2026001", "2026-01-01", List.of("01", "02", "03", "04", "05", "06"), "07")
        ));

        assertThat(service.distribution())
                .containsKeys("redSum", "oddCount", "bigCount", "span")
                .satisfies(result -> assertThat(result.get("redSum")).extracting("value").containsExactly("21"));
    }

    private static LotteryDraw draw(String issue, String date, List<String> redNumbers, String blueNumber) {
        int redSum = redNumbers.stream().mapToInt(Integer::parseInt).sum();
        int oddCount = (int) redNumbers.stream().mapToInt(Integer::parseInt).filter(number -> number % 2 != 0).count();
        int bigCount = (int) redNumbers.stream().mapToInt(Integer::parseInt).filter(number -> number >= 17).count();
        int span = Integer.parseInt(redNumbers.get(redNumbers.size() - 1)) - Integer.parseInt(redNumbers.get(0));
        return LotteryDraw.builder()
                .issue(issue)
                .drawDate(date)
                .redNumbers(redNumbers)
                .blueNumber(blueNumber)
                .redSum(redSum)
                .oddCount(oddCount)
                .evenCount(6 - oddCount)
                .bigCount(bigCount)
                .smallCount(6 - bigCount)
                .span(span)
                .build();
    }
}
