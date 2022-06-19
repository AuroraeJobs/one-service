package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.model.CwlRed3;
import org.aurorae.cwl.repository.CwlRed3Repository;
import org.aurorae.cwl.service.CwlRed3Service;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

@Component
public class CwlRed3ServiceImpl implements CwlRed3Service {

    @Resource
    private CwlRed3Repository repository;

    @Override
    public CwlRed3 findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public CwlRed3 save(CwlRed3 item) {
        return repository.save(item);
    }

    @Override
    public List<CwlRed3> findAll() {
        return repository.findAll();
    }
}
