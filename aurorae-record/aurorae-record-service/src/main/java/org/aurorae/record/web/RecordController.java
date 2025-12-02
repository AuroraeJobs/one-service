package org.aurorae.record.web;

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
    public Record last() {
        return service.findLast();
    }

    @GetMapping("first")
    public Record first() {
        return service.findFirst();
    }

    @GetMapping("findById")
    public Record findById(@RequestParam String id) {
        return service.findById(id);
    }

    @PostMapping("find")
    public List<Record> find(@RequestBody RecordRequest request) {
        return service.find(request);
    }

    @GetMapping("count")
    public List<Record> getByCount(@RequestParam long issueCount) {
        return RecordClient.record(issueCount);
    }

    @GetMapping("issue")
    public List<Record> getByIssue(@RequestParam String start, @RequestParam String end) {
        return RecordClient.record(start, end);
    }

    @GetMapping("records")
    public String getRecords() {
        return RecordFile.read(RecordFile.RECORDS);
    }
}
