package com.one.record.service;

import com.one.record.request.RecordRequest;
import com.one.record.response.Record;
import com.one.record.response.RecordYearCount;

import java.util.List;

public interface IRecordService {

    void saveAll(List<Record> item);

    Record findFirst();

    Record findLast();

    Record findById(String id);

    List<Record> findAll();

    List<Record> find(RecordRequest request);

    List<RecordYearCount> countByYear();

    List<RecordYearCount> getYearCounts();
}
