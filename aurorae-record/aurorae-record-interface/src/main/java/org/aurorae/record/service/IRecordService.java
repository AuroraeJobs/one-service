package org.aurorae.record.service;

import org.aurorae.record.response.Record;

import java.util.List;

public interface IRecordService {

    void saveAll(List<Record> item);

    Record findFirst();

    Record findLast();

    Record findById(String id);

    List<Record> findAll();
}
