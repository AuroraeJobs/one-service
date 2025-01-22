package org.aurorae.cwl.service.impl;

import lombok.AllArgsConstructor;
import org.aurorae.cwl.repository.RecordRepository;
import org.aurorae.cwl.response.Record;
import org.aurorae.cwl.service.IRecordService;
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
    public Record findAsc() {
        return repository.findTopByOrderByCodeAsc();
    }

    @Override
    public Record findDesc() {
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
