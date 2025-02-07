package org.aurorae.record.service.impl;

import lombok.AllArgsConstructor;
import org.aurorae.record.repository.RecordRepository;
import org.aurorae.record.response.Record;
import org.aurorae.record.service.IRecordService;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@AllArgsConstructor
public class RecordService implements IRecordService {

    private final RecordRepository repository;

    @Override
    public void saveAll(List<Record> item) {
        repository.saveAll(item);
    }

    @Override
    public Record findFirst() {
        return repository.findTopByOrderByCodeAsc();
    }

    @Override
    public Record findLast() {
        return repository.findTopByOrderByCodeDesc();
    }

    @Override
    public Record findById(String id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public List<Record> findAll() {
        return repository.findAll();
    }
}
