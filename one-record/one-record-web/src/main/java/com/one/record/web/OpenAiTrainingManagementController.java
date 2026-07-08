package com.one.record.web;

import com.one.record.ai.OpenAiTrainingManagementDashboard;
import com.one.record.ai.OpenAiTrainingReportRequest;
import com.one.record.model.OpenAiTrainingReportRecord;
import com.one.record.service.IOpenAiTrainingManagementService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("ai/training")
@AllArgsConstructor
public class OpenAiTrainingManagementController {

    private final IOpenAiTrainingManagementService service;

    @GetMapping("dashboard")
    public OpenAiTrainingManagementDashboard dashboard() {
        return service.dashboard();
    }

    @GetMapping("reports")
    public List<OpenAiTrainingReportRecord> reports(@RequestParam(required = false) Integer limit) {
        return service.reports(limit);
    }

    @PostMapping("reports")
    public OpenAiTrainingReportRecord saveReport(@RequestBody(required = false) OpenAiTrainingReportRequest request) {
        return service.saveReport(request);
    }
}
