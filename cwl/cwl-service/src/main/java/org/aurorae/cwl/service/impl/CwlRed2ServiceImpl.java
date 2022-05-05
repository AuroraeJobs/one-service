package org.aurorae.cwl.service.impl;

import com.alibaba.dubbo.config.annotation.Service;
import org.aurorae.cwl.model.CwlRed2;
import org.aurorae.cwl.repository.CwlRed2Repository;
import org.aurorae.cwl.service.CwlRed2Service;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

@Service
@Component
public class CwlRed2ServiceImpl implements CwlRed2Service {

    @Resource
    private CwlRed2Repository repository;

    @Override
    public CwlRed2 findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public CwlRed2 save(CwlRed2 item) {
        return repository.save(item);
    }

    @Override
    public List<CwlRed2> findAll() {
        return repository.findAll();
    }
}
