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

import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@AllArgsConstructor
public class RecordUpdater implements CommandLineRunner {

    private final IRecordService recordService;

    private final IBoxService boxService;

    @Override
    public void run(String... args) {
        Record record = recordService.findLast();
        if (record != null) {
            update(record);
            //update();
        } else {
            init();
        }
    }

    private void update(Record record) {
        // 从线上获取记录进行计算
        Optional.ofNullable(RecordCalendar.fetch(record.date()))
                .ifPresent(records -> {
                    recordService.saveAll(records);
                    ColorBox box = boxService.findById(record.getCode());
                    box.save(records, boxService::save);
                });
    }

    private void update() {
        // 从数据库里获取记录进行计算
        ColorBox box = new ColorBox().init();
        List<Record> records = recordService.findAll();
        box.save(records, boxService::save);
    }

    private void init() {
        // 从2013年获取记录进行计算
        ColorBox box = new ColorBox().init();
        for (int year = 2013; year <= DateUtil.thisYear(); year++) {
            List<Record> records = RecordClient.year(year);
            recordService.saveAll(records);
            box.save(records, boxService::save);
        }
    }
}
