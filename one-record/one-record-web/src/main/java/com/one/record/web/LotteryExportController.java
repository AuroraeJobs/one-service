package com.one.record.web;

import com.one.record.lottery.LotteryExportResult;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.service.ILotteryExportService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("lottery")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class LotteryExportController {

    private final ILotteryExportService service;

    @GetMapping("exports/{type}")
    @Operation(summary = "导出彩票数据", description = "按类型导出 CSV-shaped 数据并记录导出审计")
    public LotteryExportResult export(@PathVariable("type") String type,
                                      @RequestParam Map<String, String> filters) {
        return service.export(type, filters);
    }

    @GetMapping("audit/events")
    @Operation(summary = "查询彩票审计事件", description = "查询最近导出和平台审计事件")
    public LotteryPageResponse<LotteryAuditEvent> auditEvents(@RequestParam(value = "page", required = false, defaultValue = "1") Integer page,
                                                             @RequestParam(value = "pageSize", required = false, defaultValue = "20") Integer pageSize) {
        return service.auditEvents(page, pageSize);
    }
}
