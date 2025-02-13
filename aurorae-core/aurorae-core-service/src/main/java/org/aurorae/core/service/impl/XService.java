package org.aurorae.core.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.core.model.XX;
import org.aurorae.core.repository.XRepository;
import org.aurorae.core.service.IXService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

/**
 * @author aurorae
 */
@Component
@Slf4j
public class XService implements IXService {

    @Resource
    private XRepository repository;

    @Override
    public List<XX> findAll() {
        return repository.findAll();
    }

    @Override
    public List<XX> save(List<XX> items) {
        return repository.saveAll(items);
    }
}
