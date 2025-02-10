package org.aurorae.record;

import cn.hutool.core.date.DateUtil;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.record.ball.ColorBox;
import org.aurorae.record.client.RecordClient;
import org.aurorae.record.file.RecordFile;
import org.aurorae.record.response.Record;
import org.aurorae.record.service.IBoxService;
import org.aurorae.record.service.IRecordService;
import org.aurorae.record.client.RecordCalendar;
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
            update(record.date(), record.getCode());
            //update();
        } else {
            init();
        }
    }

    private void update(String date, String code) {
        // 从线上获取记录进行计算
        Optional.ofNullable(RecordCalendar.fetch(date))
                .ifPresent(records -> Optional.ofNullable(boxService.findById(code))
                        .ifPresent(box -> save(box, records)));
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
            save(box, records);
        }
    }

    private void save(ColorBox box, List<Record> records) {
        RecordFile.write(records);
        recordService.saveAll(records);
        box.save(records, boxService::save);
    }
}
