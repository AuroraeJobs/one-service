package org.aurorae.record.web;

import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.record.client.RecordClient;
import org.aurorae.record.file.RecordFile;
import org.aurorae.record.request.RecordRequest;
import org.aurorae.record.response.Record;
import org.aurorae.record.service.IRecordService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("record")
@AllArgsConstructor
public class RecordController {

    private final IRecordService service;

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
