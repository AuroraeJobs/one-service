package com.one.record.service;

import com.one.record.lottery.LotteryCalendarState;
import com.one.record.lottery.LotteryReminderAcknowledgeRequest;

public interface ILotteryCalendarService {

    LotteryCalendarState calendar();

    LotteryCalendarState acknowledge(String key, LotteryReminderAcknowledgeRequest request);
}
