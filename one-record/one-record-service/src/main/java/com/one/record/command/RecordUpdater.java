package com.one.record.command;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.record.configuration.RecordProperties;
import com.one.record.file.RecordFile;
import com.one.record.response.Record;
import com.one.record.service.IBoxService;
import com.one.record.service.IRecordService;
import com.one.record.service.IRecordUpdate;
import com.one.record.service.LotteryDrawProvider;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@AllArgsConstructor
public class RecordUpdater implements CommandLineRunner, IRecordUpdate {

    private final IRecordService recordService;

    private final IBoxService boxService;

    private final RecordProperties properties;

    private final LotteryDrawProvider lotteryDrawProvider;

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
        List<Record> records = lotteryDrawProvider.fetchAfterDate(last.date());
        if (CollectionUtils.isEmpty(records)) {
            return;
        }
        List<Record> newRecords = prepareNewRecords(last, records);
        if (CollectionUtils.isEmpty(newRecords)) {
            return;
        }
        RecordFile.write(newRecords);
        recordService.saveAll(newRecords);
        boxService.update(last.getCode(), newRecords);
    }

    List<Record> prepareNewRecords(Record last, List<Record> records) {
        if (last == null || !StringUtils.hasText(last.getCode()) || CollectionUtils.isEmpty(records)) {
            return List.of();
        }
        Set<String> seenCodes = new HashSet<>();
        List<Record> newRecords = new ArrayList<>();
        for (Record record : records) {
            if (record == null || !StringUtils.hasText(record.getCode()) || record.getCode().compareTo(last.getCode()) <= 0) {
                continue;
            }
            if (!seenCodes.add(record.getCode())) {
                continue;
            }
            record.setLine(last.getLine() + newRecords.size() + 1);
            record.setDate(record.date());
            newRecords.add(record);
        }
        return newRecords;
    }

    private void reset() {
        // 从数据库里获取记录进行计算
        List<Record> records = recordService.findAll();
        boxService.init(records);
    }

    private void init() {
        // 从2013年获取记录进行计算
        List<Record> records = lotteryDrawProvider.fetchYearlyRecords();
        RecordFile.write(records);
        recordService.saveAll(records);
        boxService.init(records);
    }
}
