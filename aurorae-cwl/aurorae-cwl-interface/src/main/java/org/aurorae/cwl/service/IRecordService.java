package org.aurorae.cwl.service;

import org.aurorae.cwl.response.Record;

import java.util.List;

public interface IRecordService {

    void saveAll(List<Record> item);

    Record findFirst();

    Record findLast();

    Record findById(String id);

    List<Record> findAll();
}
