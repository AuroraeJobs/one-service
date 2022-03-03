package org.aurorae.core.service.impl;

import com.alibaba.dubbo.config.annotation.Service;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.core.model.Yi;
import org.aurorae.core.repository.YiRepository;
import org.aurorae.core.service.YiService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;

/**
 * @author aurorae
 */
@Service
@Component
@Slf4j
public class YiServiceImpl implements YiService {

    @Resource
    private YiRepository repository;

    @Override
    public List<Yi> findAll() {
        return repository.findAll();
    }

    @Override
    public List<Yi> save(List<Yi> items) {
        return repository.saveAll(items);
    }
}
