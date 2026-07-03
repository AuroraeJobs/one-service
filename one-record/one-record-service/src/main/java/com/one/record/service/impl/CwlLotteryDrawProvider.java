package com.one.record.service.impl;

import com.one.record.client.RecordCalendar;
import com.one.record.client.RecordClient;
import com.one.record.response.Record;
import com.one.record.service.LotteryDrawProvider;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CwlLotteryDrawProvider implements LotteryDrawProvider {

    @Override
    public String name() {
        return "cwl";
    }

    @Override
    public List<Record> fetchAfterDate(String lastDrawDate) {
        return RecordCalendar.fetch(lastDrawDate);
    }

    @Override
    public List<Record> fetchYearlyRecords() {
        return RecordClient.year();
    }
}
