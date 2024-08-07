package org.aurorae.core.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.core.model.X1;
import org.aurorae.core.model.X3;
import org.aurorae.core.repository.GuaRepository;
import org.aurorae.core.service.GuaService;
import org.aurorae.core.service.YiService;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author aurorae
 */
@Component
@Slf4j
public class GuaServiceImpl implements GuaService {

    @Resource
    private GuaRepository repository;

    @Resource
    private YiService yiService;

    @Override
    public List<X3> findAll() {
        return repository.findAll();
    }

    @Override
    public List<X3> save(List<X3> items) {
        List<X1> yis = yiService.findAll();
        return repository.saveAll(items.stream().peek(item -> {
            item.setX1_0(yis.stream().filter(yi -> yi.getCode().equals(String.valueOf(item.getCode().charAt(0)))).findAny().orElse(null));
            item.setX1_1(yis.stream().filter(yi -> yi.getCode().equals(String.valueOf(item.getCode().charAt(1)))).findAny().orElse(null));
            item.setX1_2(yis.stream().filter(yi -> yi.getCode().equals(String.valueOf(item.getCode().charAt(2)))).findAny().orElse(null));
        }).collect(Collectors.toList()));
    }
}
