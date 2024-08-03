package org.aurorae.core.service.impl;

import com.alibaba.dubbo.config.annotation.Service;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.core.model.X2;
import org.aurorae.core.model.X1;
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
    public List<X2> findAll() {
        return repository.findAll();
    }

    @Override
    public List<X2> save(List<X2> items) {
        List<X1> yis = yiService.findAll();
        return repository.saveAll(items.stream().peek(item -> {
            item.setX1_0(yis.stream().filter(yi -> yi.getCode().equals(String.valueOf(item.getCode().charAt(0)))).findAny().orElse(null));
            item.setX1_1(yis.stream().filter(yi -> yi.getCode().equals(String.valueOf(item.getCode().charAt(1)))).findAny().orElse(null));
        }).collect(Collectors.toList()));
    }
}
