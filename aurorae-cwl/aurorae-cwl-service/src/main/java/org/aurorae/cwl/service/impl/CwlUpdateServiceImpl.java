package org.aurorae.cwl.service.impl;

import java.util.List;
import java.util.Optional;

import javax.annotation.Resource;

import org.aurorae.cwl.client.CwlCli;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.model.CwlGua;
import org.aurorae.cwl.response.CwlResult;
import org.aurorae.cwl.service.*;
import org.aurorae.cwl.util.CwlCalendar;
import org.aurorae.cwl.vo.CwlUpdater;
import org.springframework.stereotype.Component;

import cn.hutool.core.date.DateUtil;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class CwlUpdateServiceImpl implements CwlUpdateService {

    @Resource
    private CwlService cwlService;

    @Resource
    private CwlValueService valueService;

    @Resource
    private CwlGuaService guaService;

    @Resource
    private ICwlResultService resultService;

    @Override
    public void update() {
        CwlResult nowIssue = resultService.findDesc();
        if (nowIssue == null) {
            init();
        } else {
            update(nowIssue);
        }
    }

    private void init() {
        // 如果当前没有数据，从2013年初始化
        CwlUpdater updater = new CwlUpdater();
        for (int year = 2013; year <= DateUtil.thisYear(); year++) {
            List<CwlResult> cwlList = CwlCli.oneYear(year);
            updater = update(updater.setCwlList(cwlList));
        }
    }

    private void update(CwlResult nowIssue) {
        Optional.ofNullable(CwlCalendar.fetch(nowIssue.dateInfo())).ifPresent(results -> {
            long nowId = Long.parseLong(nowIssue.getCode());
            CwlGua gua = guaService.findById(nowId);
            update(new CwlUpdater(results, gua, nowId));
        });
    }

    private CwlUpdater update(CwlUpdater updater) {
        for (Cwl cwl : updater.getCwlList()) {
            cwl.setLastById(updater.getLastId());
            guaService.save(updater.updateGuaByCwl(cwl));
            updater.setValuePr(cwl.getId());
            updater.setLastId(cwl.getId());
        }
        valueService.saveAll(updater.getValueList());
        cwlService.saveAll(updater.getCwlList());
        resultService.saveAll(updater.getResultList());
        return updater;
    }
}
