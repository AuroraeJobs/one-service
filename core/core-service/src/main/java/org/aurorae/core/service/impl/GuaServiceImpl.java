package org.aurorae.core.service.impl;

import com.alibaba.dubbo.config.annotation.Service;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.core.model.Gua;
import org.aurorae.core.model.Yi;
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
@Service
@Component
@Slf4j
public class GuaServiceImpl implements GuaService {

    @Resource
    private GuaRepository repository;

    @Resource
    private YiService yiService;

    @Override
    public List<Gua> findAll() {
        return repository.findAll();
    }

    @Override
    public List<Gua> save(List<Gua> items) {
        List<Yi> yis = yiService.findAll();
        return repository.saveAll(items.stream().peek(item -> {
            item.setTian(yis.stream().filter(yi -> yi.getCode().equals(String.valueOf(item.getCode().charAt(0)))).findAny().orElse(null));
            item.setRen(yis.stream().filter(yi -> yi.getCode().equals(String.valueOf(item.getCode().charAt(1)))).findAny().orElse(null));
            item.setDi(yis.stream().filter(yi -> yi.getCode().equals(String.valueOf(item.getCode().charAt(2)))).findAny().orElse(null));
        }).collect(Collectors.toList()));
    }
}
