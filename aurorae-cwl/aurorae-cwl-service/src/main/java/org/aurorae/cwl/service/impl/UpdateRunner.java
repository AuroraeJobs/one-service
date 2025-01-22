package org.aurorae.cwl.service.impl;

import cn.hutool.core.date.DateUtil;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.cwl.ball.ColorBox;
import org.aurorae.cwl.client.RecordClient;
import org.aurorae.cwl.response.Record;
import org.aurorae.cwl.service.IBoxService;
import org.aurorae.cwl.service.IRecordService;
import org.aurorae.cwl.util.RecordCalendar;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@AllArgsConstructor
public class UpdateRunner implements CommandLineRunner {

    private final IRecordService recordService;

    private final IBoxService boxService;

    @Override
    public void run(String... args) {
        Record nowIssue = recordService.findDesc();
        if (nowIssue == null) {
            init();
        } else {
            //update();
            update(nowIssue);
        }
    }

    private void init() {
        // 从2013年初始化数据
        ColorBox box = new ColorBox().init();
        String last = null;
        for (int year = 2013; year <= DateUtil.thisYear(); year++) {
            List<Record> records = RecordClient.oneYear(year);
            records.sort(Comparator.comparing(Record::getCode));
            for (Record record : records) {
                boxService.save(box.result(record, last));
                last = record.getCode();
            }
            recordService.saveAll(records);
        }
    }

    private void update() {
        // 从数据库里查询记录进行计算
        ColorBox box = new ColorBox().init();
        String last = null;
        List<Record> records = recordService.findAll();
        for (Record record : records) {
            boxService.save(box.result(record, last));
            last = record.getCode();
        }
    }

    private void update(Record nowIssue) {
        // 从线上获取记录进行计算
        Optional.ofNullable(RecordCalendar.fetch(nowIssue.date()))
                .ifPresent(records -> {
                    ColorBox box = boxService.findById(nowIssue.getCode());
                    String last = nowIssue.getCode();
                    for (Record record : records) {
                        boxService.save(box.result(record, last));
                        last = record.getCode();
                    }
                    recordService.saveAll(records);
                });
    }
}
