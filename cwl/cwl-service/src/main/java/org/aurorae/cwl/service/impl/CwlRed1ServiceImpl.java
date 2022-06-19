package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.model.CwlRed1;
import org.aurorae.cwl.repository.CwlRed1Repository;
import org.aurorae.cwl.service.CwlRed1Service;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

@Component
public class CwlRed1ServiceImpl implements CwlRed1Service {

    @Resource
    private CwlRed1Repository repository;

    @Override
    public CwlRed1 findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public CwlRed1 save(CwlRed1 item) {
        return repository.save(item);
    }

    @Override
    public List<CwlRed1> findAll() {
        return repository.findAll();
    }
}
