package com.one.record.web;

import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.record.client.RecordClient;
import com.one.record.file.RecordFile;
import com.one.record.request.RecordRequest;
import com.one.record.response.Record;
import com.one.record.response.RecordYearCount;
import com.one.record.service.IRecordService;
import com.one.record.service.IRecordUpdate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("record")
@AllArgsConstructor
public class RecordController {

    private final IRecordService service;

    private final IRecordUpdate recordUpdate;

    @GetMapping("update")
    public void update() {
        recordUpdate.update();
    }

    @GetMapping("last")
    @Operation(summary = "末期数据查询", description = "从数据库获取数据")
    public Record last() {
        return service.findLast();
    }

    @GetMapping("first")
    @Operation(summary = "首期数据查询", description = "从数据库获取数据")
    public Record first() {
        return service.findFirst();
    }

    @GetMapping("findById")
    @Operation(summary = "数据id查询", description = "从数据库获取数据")
    public Record findById(@RequestParam String id) {
        return service.findById(id);
    }

    @PostMapping("find")
    @Operation(summary = "筛选条件查询", description = "从数据库获取数据")
    public List<Record> find(@RequestBody RecordRequest request) {
        return service.find(request);
    }

    @GetMapping("yearly-counts")
    @Operation(summary = "年度记录数查询", description = "从 Redis 获取年度记录数统计")
    public List<RecordYearCount> getYearCounts() {
        return service.getYearCounts();
    }

    @PostMapping("yearly-counts/statistics")
    @Operation(summary = "年度记录数统计", description = "按开奖日期年份统计记录数，并保存到 Redis")
    public List<RecordYearCount> countByYear() {
        return service.countByYear();
    }

    @GetMapping("count")
    @Operation(summary = "期数查询", description = "从网站获取数据")
    public List<Record> getByCount(@RequestParam long issueCount) {
        return RecordClient.record(issueCount);
    }

    @GetMapping("issue")
    @Operation(summary = "期号查询", description = "从网站获取数据")
    public List<Record> getByIssue(@RequestParam String start, @RequestParam String end) {
        return RecordClient.record(start, end);
    }

    @GetMapping("records")
    @Operation(summary = "数据查询", description = "从文件获取数据")
    public String getRecords() {
        return RecordFile.read(RecordFile.RECORDS);
    }
}
