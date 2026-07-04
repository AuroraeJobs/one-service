package com.one.record.service;

import com.one.record.lottery.LotteryProviderProbeResult;
import com.one.record.response.Record;

import java.util.List;

public interface LotteryDrawProvider {

    String name();

    List<Record> fetchAfterDate(String lastDrawDate);

    List<Record> fetchYearlyRecords();

    default LotteryProviderProbeResult probe() {
        long startedAt = System.currentTimeMillis();
        try {
            List<Record> records = fetchYearlyRecords();
            return LotteryProviderProbeResult.builder()
                    .category("draw")
                    .provider(name())
                    .success(true)
                    .status("AVAILABLE")
                    .message("provider 探测成功")
                    .recordCount(records == null ? 0 : records.size())
                    .durationMs(System.currentTimeMillis() - startedAt)
                    .checkedAt(System.currentTimeMillis())
                    .build();
        } catch (RuntimeException exception) {
            return LotteryProviderProbeResult.builder()
                    .category("draw")
                    .provider(name())
                    .success(false)
                    .status("FAILED")
                    .message(exception.getMessage())
                    .recordCount(0)
                    .durationMs(System.currentTimeMillis() - startedAt)
                    .checkedAt(System.currentTimeMillis())
                    .build();
        }
    }
}
