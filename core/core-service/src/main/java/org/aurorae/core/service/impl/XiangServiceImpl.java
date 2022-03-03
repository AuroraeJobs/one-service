package org.aurorae.core.service.impl;

import com.alibaba.dubbo.config.annotation.Service;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.core.model.Xiang;
import org.aurorae.core.model.Yi;
import org.aurorae.core.repository.XiangRepository;
import org.aurorae.core.service.XiangService;
import org.aurorae.core.service.YiService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author aurorae
 */
@Service
@Component
@Slf4j
public class XiangServiceImpl implements XiangService {

    @Resource
    private XiangRepository repository;

    @Resource
    private YiService yiService;

    @Override
    public List<Xiang> findAll() {
        return repository.findAll();
    }

    @Override
    public List<Xiang> save(List<Xiang> items) {
        List<Yi> yis = yiService.findAll();
        return repository.saveAll(items.stream().peek(item -> {
            item.setUp(yis.stream().filter(yi -> yi.getCode().equals(String.valueOf(item.getCode().charAt(0)))).findAny().orElse(null));
            item.setLow(yis.stream().filter(yi -> yi.getCode().equals(String.valueOf(item.getCode().charAt(1)))).findAny().orElse(null));
        }).collect(Collectors.toList()));
    }
}
