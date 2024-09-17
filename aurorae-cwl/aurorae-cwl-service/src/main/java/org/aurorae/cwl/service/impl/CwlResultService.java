package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.repository.CwlResultRepository;
import org.aurorae.cwl.response.CwlResult;
import org.aurorae.cwl.service.ICwlResultService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

@Component
public class CwlResultService implements ICwlResultService {

    @Resource
    private CwlResultRepository repository;

    @Override
    public CwlResult findAsc() {
        return repository.findTopByOrderByCodeAsc();
    }

    @Override
    public CwlResult findDesc() {
        return repository.findTopByOrderByCodeDesc();
    }

    @Override
    public CwlResult findById(String id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public CwlResult save(CwlResult item) {
        return repository.save(item);
    }

    @Override
    public List<CwlResult> saveAll(List<CwlResult> item) {
        return repository.saveAll(item);
    }
}
