package org.aurorae.cwl.service.impl;

import com.alibaba.dubbo.config.annotation.Service;
import org.aurorae.cwl.model.CwlRed5;
import org.aurorae.cwl.repository.CwlRed5Repository;
import org.aurorae.cwl.service.CwlRed5Service;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

@Service
@Component
public class CwlRed5ServiceImpl implements CwlRed5Service {

    @Resource
    private CwlRed5Repository repository;

    @Override
    public CwlRed5 findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public CwlRed5 save(CwlRed5 item) {
        return repository.save(item);
    }

    @Override
    public List<CwlRed5> findAll() {
        return repository.findAll();
    }
}
