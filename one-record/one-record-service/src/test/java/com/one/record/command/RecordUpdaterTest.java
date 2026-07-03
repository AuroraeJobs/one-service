package com.one.record.command;

import com.one.record.configuration.RecordProperties;
import com.one.record.response.Record;
import com.one.record.service.IBoxService;
import com.one.record.service.IRecordService;
import com.one.record.service.LotteryDrawProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

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
        Record last = new Record();
        last.setCode("2026001");
        last.setDate("2026-07-03");
        when(recordService.findLast()).thenReturn(last);
        when(lotteryDrawProvider.fetchAfterDate("2026-07-03")).thenReturn(List.of());

        updater.update();

        verify(lotteryDrawProvider).fetchAfterDate("2026-07-03");
        verify(recordService, never()).saveAll(org.mockito.ArgumentMatchers.anyList());
        verify(boxService, never()).update(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyList());
    }
}
