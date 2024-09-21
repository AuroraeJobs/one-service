package org.aurorae.cwl.service.impl;

import cn.hutool.core.date.DateUtil;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.util.StreamUtil;
import org.aurorae.cwl.client.CwlCli;
import org.aurorae.cwl.client.CwlFile;
import org.aurorae.cwl.model.Cwl;
import org.aurorae.cwl.model.CwlGua;
import org.aurorae.cwl.response.CwlResult;
import org.aurorae.cwl.service.*;
import org.aurorae.cwl.util.CwlDateUtil;
import org.aurorae.cwl.vo.CwlUpdater;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

@Slf4j
@Component
public class CwlUpdateServiceImpl implements CwlUpdateService {

    private static final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");

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
        // 如果当前没有数据，进行初始化
        if (nowIssue == null) {
            init();
            return;
        }
        String now = nowIssue.getDate().substring(0, 10);
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        Date endTime = calendar.getTime();
        String end = dateFormat.format(endTime);
        try {
            calendar.setTime(dateFormat.parse(now));
        } catch (ParseException e) {
            throw new RuntimeException(e);
        }
        CwlDateUtil.nextIssue(calendar);
        Date startTime = calendar.getTime();
        String start = dateFormat.format(startTime);
        log.info("\n> current: {}, next: {}, today: {}", now, start, end);
        if (endTime.after(startTime)) {
            // 有数据的情况，进行增量更新
            List<CwlResult> cwlList = CwlCli.result(start, end);
            log.info("\n> {}", StreamUtil.toList(cwlList, CwlResult::getCode));
            CwlFile.write(cwlList, "all.txt");
            long nowId = Long.parseLong(nowIssue.getCode());
            CwlGua gua = guaService.findById(nowId);
            update(new CwlUpdater(cwlList, gua, nowId));
        }
    }

    private void init() {
        System.out.println("----init----");
        CwlUpdater updater = new CwlUpdater();
        // 初始化, 从2013年开始
        for (int year = 2013; year <= DateUtil.thisYear(); year++) {
            List<CwlResult> cwlList = CwlCli.oneYear(year);
            updater = update(updater.setCwlList(cwlList));
        }
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
