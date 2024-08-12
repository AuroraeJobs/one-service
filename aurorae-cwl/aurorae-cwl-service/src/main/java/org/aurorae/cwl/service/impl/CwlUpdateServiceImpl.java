package org.aurorae.cwl.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.model.BaseObject;
import org.aurorae.common.util.StreamUtil;
import org.aurorae.cwl.model.*;
import org.aurorae.cwl.service.CwlGuaService;
import org.aurorae.cwl.service.CwlService;
import org.aurorae.cwl.service.CwlUpdateService;
import org.aurorae.cwl.service.CwlValueService;
import org.aurorae.cwl.vo.CwlUpdater;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Calendar;
import java.util.List;

@Slf4j
@Component
public class CwlUpdateServiceImpl implements CwlUpdateService {

    @Resource
    private CwlService cwlService;

    @Resource
    private CwlValueService valueService;

    @Resource
    private CwlGuaService guaService;

    @Override
    public void update() {
        Cwl nowIssue = cwlService.findDesc();
        // 如果当前没有数据，进行初始化
        if (nowIssue == null) {
            init();
            return;
        }
        long nowId = nowIssue.getId();
        Cwl newIssue = cwlService.oneLast();
        long newId = newIssue.getId();
        long count = newId - nowId;
        log.info("\n> new: {}, now: {}, count: {}", newId, nowId, count);
        if (count > 0) {
            // 有数据的情况，进行增量更新
            List<Cwl> cwlList = cwlService.getByIssue(String.valueOf(nowId + 1), String.valueOf(newId));
            log.info("\n> {}", StreamUtil.toList(cwlList, BaseObject::getId));
            CwlGua gua = guaService.findById(nowId);
            update(new CwlUpdater(cwlList, gua, nowId));
        }
    }

    private void init() {
        System.out.println("----init----");
        CwlUpdater updater = new CwlUpdater();
        int year = Calendar.getInstance().get(Calendar.YEAR);
        // 初始化10年的数据（过去9年+当年）
        for (int i = year - 9; i <= year; i++) {
            List<Cwl> cwlList = cwlService.allYear(i);
            updater = update(updater.setCwlList(cwlList));
        }
    }

    private CwlUpdater update(CwlUpdater updater) {
        for (Cwl cwl : updater.getNewList()) {
            cwl.setLastById(updater.getLastId());
            guaService.save(updater.updateGuaByCwl(cwl));
            updater.setValuePr(cwl.getId());
            updater.setLastId(cwl.getId());
        }
        valueService.saveAll(updater.getCwlValues());
        cwlService.saveAll(updater.getNewList());
        return updater;
    }
}
