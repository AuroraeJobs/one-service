package com.one.record.service;

import com.one.record.response.Record;

import java.util.List;

public interface LotteryDrawProvider {

    String name();

    List<Record> fetchAfterDate(String lastDrawDate);

    List<Record> fetchYearlyRecords();
}
