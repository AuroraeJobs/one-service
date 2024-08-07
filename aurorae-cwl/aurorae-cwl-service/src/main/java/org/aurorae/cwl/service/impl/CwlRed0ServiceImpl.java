package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.model.CwlRed0;
import org.aurorae.cwl.repository.CwlRed0Repository;
import org.aurorae.cwl.service.CwlRed0Service;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

@Component
public class CwlRed0ServiceImpl implements CwlRed0Service {

    @Resource
    private CwlRed0Repository repository;

    @Override
    public CwlRed0 findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public CwlRed0 save(CwlRed0 item) {
        return repository.save(item);
    }

    @Override
    public List<CwlRed0> findAll() {
        return repository.findAll();
    }
}
