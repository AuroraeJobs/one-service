package com.one.record.service;

import com.one.record.lottery.LotteryExportResult;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryAuditEvent;

import java.util.Map;

public interface ILotteryExportService {

    LotteryExportResult export(String type, Map<String, String> filters);

    LotteryPageResponse<LotteryAuditEvent> auditEvents(Integer page, Integer pageSize);
}
