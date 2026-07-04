package com.one.record.web;

import com.one.record.lottery.LotteryReminderAcknowledgeRequest;
import com.one.record.lottery.LotteryReminderSummary;
import com.one.record.service.ILotteryReminderService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("lottery/reminders")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class LotteryReminderController {

    private final ILotteryReminderService service;

    @GetMapping("summary")
    @Operation(summary = "查询彩票行动提醒摘要", description = "聚合同步、开奖日历、票据、决策、质量和月末导出的每日行动提醒")
    public LotteryReminderSummary summary() {
        return service.summary();
    }

    @PostMapping("{key}/ack")
    @Operation(summary = "确认彩票行动提醒", description = "按提醒 key 和指纹记录确认审计事件，并返回最新提醒摘要")
    public LotteryReminderSummary acknowledge(@PathVariable("key") String key,
                                              @RequestBody LotteryReminderAcknowledgeRequest request) {
        return service.acknowledge(key, request);
    }

    @PostMapping("{key}/snooze")
    @Operation(summary = "稍后处理彩票行动提醒", description = "按提醒 key 和指纹记录稍后处理审计事件，并返回最新提醒摘要")
    public LotteryReminderSummary snooze(@PathVariable("key") String key,
                                         @RequestBody LotteryReminderAcknowledgeRequest request) {
        return service.snooze(key, request);
    }
}
