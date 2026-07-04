package com.one.record.web;

import com.one.record.lottery.LotteryCalendarState;
import com.one.record.lottery.LotteryReminderAcknowledgeRequest;
import com.one.record.service.ILotteryCalendarService;
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
@RequestMapping("lottery")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class LotteryCalendarController {

    private final ILotteryCalendarService service;

    @GetMapping("calendar")
    @Operation(summary = "查询彩票开奖日历", description = "返回下一期开奖日、预计同步窗口和站内提醒")
    public LotteryCalendarState calendar() {
        return service.calendar();
    }

    @PostMapping("alerts/{key}/ack")
    @Operation(summary = "确认彩票站内提醒", description = "按提醒类型和指纹确认当前提醒，底层状态变化后会重新生成")
    public LotteryCalendarState acknowledge(@PathVariable("key") String key,
                                            @RequestBody LotteryReminderAcknowledgeRequest request) {
        return service.acknowledge(key, request);
    }
}
