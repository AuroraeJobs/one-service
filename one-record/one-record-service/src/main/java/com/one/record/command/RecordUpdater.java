package com.one.record.command;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.record.client.RecordCalendar;
import com.one.record.client.RecordClient;
import com.one.record.configuration.RecordProperties;
import com.one.record.file.RecordFile;
import com.one.record.response.Record;
import com.one.record.service.IBoxService;
import com.one.record.service.IRecordService;
import com.one.record.service.IRecordUpdate;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.util.List;

@Slf4j
@Component
@AllArgsConstructor
public class RecordUpdater implements CommandLineRunner, IRecordUpdate {

    private final IRecordService recordService;

    private final IBoxService boxService;

    private final RecordProperties properties;

    @Override
    public void run(String... args) {
        if (properties.isUpdate()) {
            // 增量更新
            update();
        }
        if (properties.isReset()) {
            // 根据已有的记录，重新计算
            reset();
        }
        if (properties.isInit()) {
            // 初始化
            init();
        }
    }

    @Override
    public void update() {
        Record last = recordService.findLast();
        if (last == null) {
            return;
        }
        // 从线上获取记录进行计算
        List<Record> records = RecordCalendar.fetch(last.date());
        if (CollectionUtils.isEmpty(records)) {
            return;
        }
        // 对新记录重新设置一些属性
        for (int i = 0; i < records.size(); i++) {
            Record record = records.get(i);
            record.setLine(last.getLine() + i + 1);
            record.setDate(record.date());
        }
        RecordFile.write(records);
        recordService.saveAll(records);
        boxService.update(last.getCode(), records);
    }

    private void reset() {
        // 从数据库里获取记录进行计算
        List<Record> records = recordService.findAll();
        boxService.init(records);
    }

    private void init() {
        // 从2013年获取记录进行计算
        List<Record> records = RecordClient.year();
        RecordFile.write(records);
        recordService.saveAll(records);
        boxService.init(records);
    }
}
