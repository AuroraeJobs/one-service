package org.aurorae.cwl.service.impl;

import org.aurorae.common.util.StreamUtil;
import org.aurorae.cwl.model.China;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.model.Province;
import org.aurorae.cwl.service.CwlService;
import org.aurorae.cwl.service.IChinaService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
public class ChinaService implements IChinaService {

    @Resource
    private CwlService cwlService;

    @Override
    public Collection<Province> color(String color, String year) {
        List<Cwl> cwlList = cwlService.findByYear(year);
        List<Integer> list = "blue".equals(color) ? StreamUtil.toList(cwlList, Cwl::getBlue) : StreamUtil.flatList(cwlList, Cwl::getRed);
        Map<Integer, Long> counting = StreamUtil.groupingByCounting(list, Function.identity());
        China one = China.one();
        one.count(counting);
        return one.getProvinceMap().values();
    }
}
