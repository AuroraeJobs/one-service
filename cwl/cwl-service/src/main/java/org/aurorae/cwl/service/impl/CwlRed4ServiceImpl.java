package org.aurorae.cwl.service.impl;

import com.alibaba.dubbo.config.annotation.Service;
import org.aurorae.cwl.model.CwlRed4;
import org.aurorae.cwl.repository.CwlRed4Repository;
import org.aurorae.cwl.service.CwlRed4Service;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

@Service
@Component
public class CwlRed4ServiceImpl implements CwlRed4Service {

    @Resource
    private CwlRed4Repository repository;

    @Override
    public CwlRed4 findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public CwlRed4 save(CwlRed4 item) {
        return repository.save(item);
    }

    @Override
    public List<CwlRed4> findAll() {
        return repository.findAll();
    }
}
