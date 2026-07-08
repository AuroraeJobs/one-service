package com.one.record.web;

import com.one.record.ai.OpenAiTrainingManagementDashboard;
import com.one.record.service.IOpenAiTrainingManagementService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("ai/training")
@AllArgsConstructor
public class OpenAiTrainingManagementController {

    private final IOpenAiTrainingManagementService service;

    @GetMapping("dashboard")
    public OpenAiTrainingManagementDashboard dashboard() {
        return service.dashboard();
    }
}
