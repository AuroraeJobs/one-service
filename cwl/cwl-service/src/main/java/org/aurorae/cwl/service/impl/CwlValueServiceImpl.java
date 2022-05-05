package org.aurorae.cwl.service.impl;

import com.alibaba.dubbo.config.annotation.Service;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.model.CwlValue;
import org.aurorae.cwl.repository.CwlValueRepository;
import org.aurorae.cwl.service.CwlService;
import org.aurorae.cwl.service.CwlValueService;
import org.aurorae.cwl.vo.CwlCrease;
import org.aurorae.cwl.vo.CwlCreaseV;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Iterator;
import java.util.List;

@Service
@Component
public class CwlValueServiceImpl implements CwlValueService {

    @Resource
    private CwlValueRepository repository;

    @Resource
    private CwlService cwlService;

    @Override
    public List<CwlValue> saveAll(List<CwlValue> all) {
        return repository.saveAll(all);
    }

    @Override
    public void compareSum() {
        CwlCrease crease = new CwlCrease().init();
        Iterator<CwlValue> iterator = cwlService.findAllAsc().stream().map(CwlValue::new).iterator();
        CwlValue last = iterator.next();
        while (iterator.hasNext()) {
            CwlValue next = iterator.next();
            crease.compareSum(next, last);
            last = next;
        }
        System.out.println(crease.getIncrease().getCode() + ": " + crease.getIncrease().getMaxV());
        System.out.println(crease.getDecrease().getCode() + ": " + crease.getDecrease().getMaxV());
        System.out.println(crease.getEquals().getCode() + ": " + crease.getEquals().getMaxV());
    }

    @Override
    public CwlCreaseV compareRed0IsNot(int v) {
        CwlCreaseV isNot = new CwlCreaseV();
        cwlService.findAllAsc().forEach(cwl -> {
            if (cwl.getRed0() != v) {
                isNot.count();
            } else {
                isNot.reset(cwl.getCode(), cwl.getDate(), cwl.getLastId());
            }
        });
        return isNot;
    }
}
