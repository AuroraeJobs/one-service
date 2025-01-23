package org.aurorae.cwl.web;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aurorae.cwl.client.RecordClient;
import org.aurorae.cwl.response.Record;
import org.aurorae.cwl.service.IRecordService;
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

    @GetMapping("count")
    public List<Record> getByCount(@RequestParam long issueCount) {
        return RecordClient.record(issueCount);
    }

    @GetMapping("issue")
    public List<Record> getByIssue(@RequestParam String start, @RequestParam String end) {
        return RecordClient.record(start, end);
    }
}
