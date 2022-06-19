package org.aurorae.cwl.service.impl;

import org.aurorae.common.model.BaseObject;
import org.aurorae.cwl.model.*;
import org.aurorae.cwl.service.CwlGuaService;
import org.aurorae.cwl.service.CwlService;
import org.aurorae.cwl.service.CwlUpdateService;
import org.aurorae.cwl.service.CwlValueService;
import org.aurorae.cwl.vo.CwlUpdater;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Calendar;
import java.util.Optional;

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
        long newId = cwlService.getNewIssue().getId();
        // 如果当前没有数据，进行初始化
        long nowId = Optional.ofNullable(cwlService.findDesc()).map(BaseObject::getId).orElseGet(this::init);
        System.out.printf("new: %s, now: %s%n", newId, nowId);
        int i = (int) (newId - nowId);
        if (i > 0) {
            // 有数据的情况，进行增量更新
            update(new CwlUpdater(cwlService.getNewIssues(i), guaService.findById(nowId), nowId));
        }
    }

    private long init() {
        System.out.println("----init----");
        CwlUpdater updater = new CwlUpdater();
        int year = Calendar.getInstance().get(Calendar.YEAR);
        // 初始化10年的数据（过去9年+当年）
        for (int i = year - 9; i <= year; i++) {
            updater = update(updater.setCwlList(cwlService.getIssuesByYear(i)));
        }
        return updater.getLastId();
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
