package org.aurorae.cwl.service.impl;

import org.aurorae.common.util.StreamUtil;
import org.aurorae.cwl.model.China;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.service.CwlService;
import org.aurorae.cwl.service.IChinaService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;

@Service
public class ChinaService implements IChinaService {

    @Resource
    private CwlService cwlService;

    @Override
    public China year(String year) {
        List<Cwl> cwlList = cwlService.findByYear(year);
        China china = China.one();
        China.count(china.getInland(), StreamUtil.flatList(cwlList, Cwl::getRed));
        China.count(china.getIsland(), StreamUtil.toList(cwlList, Cwl::getBlue));
        return china;
    }
}
