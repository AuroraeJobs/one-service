package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.model.CwlRed;
import org.aurorae.cwl.repository.CwlRedRepository;
import org.aurorae.cwl.service.CwlRedService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

@Component
public class CwlRedServiceImpl implements CwlRedService {

    @Resource
    private CwlRedRepository repository;

    @Override
    public CwlRed findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public CwlRed save(CwlRed item) {
        return repository.save(item);
    }

    @Override
    public List<CwlRed> findAll() {
        return repository.findAll();
    }
}
