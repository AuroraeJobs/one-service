package com.one.record.service;

import com.one.record.ai.OpenAiTrainingManagementDashboard;
import com.one.record.ai.OpenAiTrainingReportRequest;
import com.one.record.model.OpenAiTrainingReportRecord;

import java.util.List;

public interface IOpenAiTrainingManagementService {

    OpenAiTrainingManagementDashboard dashboard();

    List<OpenAiTrainingReportRecord> reports(Integer limit);

    OpenAiTrainingReportRecord saveReport(OpenAiTrainingReportRequest request);
}
