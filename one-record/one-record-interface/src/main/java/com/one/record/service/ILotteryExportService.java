package com.one.record.service;

import com.one.record.lottery.LotteryExportResult;
import com.one.record.model.LotteryAuditEvent;

import java.util.List;
import java.util.Map;

public interface ILotteryExportService {

    LotteryExportResult export(String type, Map<String, String> filters);

    List<LotteryAuditEvent> auditEvents(Integer limit);
}
