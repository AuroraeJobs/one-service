package org.aurorae.cwl.service.impl;

import com.alibaba.dubbo.config.annotation.Service;
import org.aurorae.cwl.model.CwlBlue;
import org.aurorae.cwl.repository.CwlBlueRepository;
import org.aurorae.cwl.service.CwlBlueService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

@Service
@Component
public class CwlBlueServiceImpl implements CwlBlueService {

    @Resource
    private CwlBlueRepository repository;

    @Override
    public CwlBlue findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public CwlBlue save(CwlBlue item) {
        return repository.save(item);
    }

    @Override
    public List<CwlBlue> findAll() {
        return repository.findAll();
    }
}
