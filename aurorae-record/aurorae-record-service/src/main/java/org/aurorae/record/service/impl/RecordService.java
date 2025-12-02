package org.aurorae.record.service.impl;

import lombok.AllArgsConstructor;
import org.aurorae.record.repository.RecordRepository;
import org.aurorae.record.request.RecordRequest;
import org.aurorae.record.response.Record;
import org.aurorae.record.service.IRecordService;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

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

    @Override
    public List<Record> find(RecordRequest request) {
        if (StringUtils.hasText(request.getIssueStart()) && StringUtils.hasText(request.getIssueEnd())) {
            return repository.findByCodeBetween(request.getIssueStart(), request.getIssueEnd());
        }
        if (StringUtils.hasText(request.getDayStart()) && StringUtils.hasText(request.getDayEnd())) {
            return repository.findByDateBetween(request.getDayStart(), request.getDayEnd());
        }
        return null;
    }
}
