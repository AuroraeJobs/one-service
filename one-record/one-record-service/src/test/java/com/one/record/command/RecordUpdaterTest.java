package com.one.record.command;

import com.one.record.configuration.RecordProperties;
import com.one.record.response.Record;
import com.one.record.service.IBoxService;
import com.one.record.service.IRecordService;
import com.one.record.service.LotteryDrawProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RecordUpdaterTest {

    private IRecordService recordService;

    private IBoxService boxService;

    private LotteryDrawProvider lotteryDrawProvider;

    private RecordUpdater updater;

    @BeforeEach
    void setUp() {
        recordService = mock(IRecordService.class);
        boxService = mock(IBoxService.class);
        lotteryDrawProvider = mock(LotteryDrawProvider.class);
        updater = new RecordUpdater(recordService, boxService, new RecordProperties(), lotteryDrawProvider);
    }

    @Test
    void updateFetchesThroughProviderAndSkipsWhenNoNewRecords() {
        Record last = record("2026001", "2026-07-03", 1);
        when(recordService.findLast()).thenReturn(last);
        when(lotteryDrawProvider.fetchAfterDate("2026-07-03")).thenReturn(List.of());

        updater.update();

        verify(lotteryDrawProvider).fetchAfterDate("2026-07-03");
        verify(recordService, never()).saveAll(org.mockito.ArgumentMatchers.anyList());
        verify(boxService, never()).update(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void updateSkipsProviderRecordsThatAreNotNewerThanLastIssue() {
        Record last = record("2026002", "2026-07-03", 2);
        when(recordService.findLast()).thenReturn(last);
        when(lotteryDrawProvider.fetchAfterDate("2026-07-03")).thenReturn(List.of(
                record("2026001", "2026-07-01", 0),
                record("2026002", "2026-07-03", 0)
        ));

        updater.update();

        verify(recordService, never()).saveAll(org.mockito.ArgumentMatchers.anyList());
        verify(boxService, never()).update(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void prepareNewRecordsDeduplicatesIssuesAndAssignsSequentialLines() {
        Record last = record("2026002", "2026-07-03", 8);
        Record older = record("2026001", "2026-07-01", 0);
        Record sameAsLast = record("2026002", "2026-07-03", 0);
        Record next = record("2026003", "2026-07-05 21:30:00", 0);
        Record duplicateNext = record("2026003", "2026-07-05 21:30:00", 0);
        Record following = record("2026004", "2026-07-07 21:30:00", 0);

        List<Record> result = updater.prepareNewRecords(last, List.of(older, sameAsLast, next, duplicateNext, following));

        assertThat(result).extracting(Record::getCode).containsExactly("2026003", "2026004");
        assertThat(result).extracting(Record::getLine).containsExactly(9L, 10L);
        assertThat(result).extracting(Record::getDate).containsExactly("2026-07-05", "2026-07-07");
    }

    private static Record record(String code, String date, long line) {
        Record record = new Record();
        record.setCode(code);
        record.setDate(date);
        record.setLine(line);
        record.setRed("01,02,03,04,05,06");
        record.setBlue("07");
        return record;
    }
}
