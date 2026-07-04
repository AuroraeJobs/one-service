package com.one.record.service;

import com.one.record.lottery.LotteryReminderAcknowledgeRequest;
import com.one.record.lottery.LotteryReminderSummary;

public interface ILotteryReminderService {

    LotteryReminderSummary summary();

    LotteryReminderSummary acknowledge(String key, LotteryReminderAcknowledgeRequest request);

    LotteryReminderSummary snooze(String key, LotteryReminderAcknowledgeRequest request);
}
