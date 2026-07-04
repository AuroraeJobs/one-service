package com.one.record.service.impl;

import com.one.record.lottery.LotteryCalendarState;
import com.one.record.lottery.LotteryDailyState;
import com.one.record.lottery.LotteryReminderAcknowledgeRequest;
import com.one.record.model.LotteryReminderAcknowledgement;
import com.one.record.repository.LotteryReminderAcknowledgementRepository;
import com.one.record.service.ILotteryCalendarService;
import com.one.record.service.ILotteryWorkbenchService;
import com.one.record.service.IRecordService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
public class LotteryCalendarService implements ILotteryCalendarService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");

    private final IRecordService recordService;

    private final ILotteryWorkbenchService workbenchService;

    private final LotteryReminderAcknowledgementRepository acknowledgementRepository;

    private final Clock clock;

    public LotteryCalendarService(IRecordService recordService,
                                  ILotteryWorkbenchService workbenchService,
                                  LotteryReminderAcknowledgementRepository acknowledgementRepository) {
        this(recordService, workbenchService, acknowledgementRepository, Clock.system(ZONE));
    }

    LotteryCalendarService(IRecordService recordService,
                           ILotteryWorkbenchService workbenchService,
                           LotteryReminderAcknowledgementRepository acknowledgementRepository,
                           Clock clock) {
        this.recordService = recordService;
        this.workbenchService = workbenchService;
        this.acknowledgementRepository = acknowledgementRepository;
        this.clock = clock;
    }

    @Override
    public LotteryCalendarState calendar() {
        com.one.record.lottery.LotteryDraw latestDraw = recordService.findLastDraw();
        LotteryDailyState dailyState = workbenchService.dailyState();
        LocalDate nextDrawDate = resolveNextDrawDate(latestDraw);
        long syncStartAt = millis(nextDrawDate.atTime(21, 30));
        long syncEndAt = millis(nextDrawDate.atTime(23, 30));
        long now = clock.millis();
        return LotteryCalendarState.builder()
                .latestIssue(latestDraw == null ? dailyState.getLatestIssue() : latestDraw.getIssue())
                .nextIssue(dailyState.getNextIssue())
                .nextDrawDate(nextDrawDate.toString())
                .drawWeekday(weekday(nextDrawDate.getDayOfWeek()))
                .expectedSyncStartAt(syncStartAt)
                .expectedSyncEndAt(syncEndAt)
                .currentIssueState(issueState(now, syncStartAt, syncEndAt))
                .reminders(activeReminders(dailyState, nextDrawDate, syncStartAt, syncEndAt))
                .generatedAt(now)
                .build();
    }

    @Override
    public LotteryCalendarState acknowledge(String key, LotteryReminderAcknowledgeRequest request) {
        if (!StringUtils.hasText(key) || request == null || !StringUtils.hasText(request.getFingerprint())) {
            throw new IllegalArgumentException("提醒标识不能为空");
        }
        acknowledgementRepository.findByReminderKeyAndFingerprint(key, request.getFingerprint())
                .orElseGet(() -> acknowledgementRepository.save(LotteryReminderAcknowledgement.builder()
                        .reminderKey(key)
                        .fingerprint(request.getFingerprint())
                        .acknowledgedAt(clock.millis())
                        .build()));
        return calendar();
    }

    private List<LotteryCalendarState.Reminder> activeReminders(LotteryDailyState state,
                                                               LocalDate nextDrawDate,
                                                               long syncStartAt,
                                                               long syncEndAt) {
        List<LotteryCalendarState.Reminder> reminders = new ArrayList<>();
        addReminder(reminders, state.getSyncState(), "sync", "同步提醒", syncStartAt);
        addReminder(reminders, state.getPredictionState(), "prediction", "预测提醒", millis(nextDrawDate.atTime(12, 0)));
        addReminder(reminders, state.getTicketState(), "tickets", "票据提醒", millis(nextDrawDate.atTime(19, 0)));
        addReminder(reminders, state.getPrizeCheckState(), "prize-check", "核奖提醒", syncEndAt);
        return reminders.stream()
                .filter(reminder -> !isAcknowledged(reminder))
                .toList();
    }

    private void addReminder(List<LotteryCalendarState.Reminder> reminders,
                             LotteryDailyState.DailyStateItem item,
                             String key,
                             String label,
                             long dueAt) {
        if (item == null || "COMPLETE".equals(item.getStatus())) {
            return;
        }
        String fingerprint = key + "|" + Objects.toString(item.getStatus(), "")
                + "|" + Objects.toString(item.getPath(), "")
                + "|" + Objects.toString(item.getPendingCount(), "0");
        reminders.add(LotteryCalendarState.Reminder.builder()
                .key(key)
                .label(label)
                .status(item.getStatus())
                .message(item.getMessage())
                .path(item.getPath())
                .fingerprint(fingerprint)
                .dueAt(dueAt)
                .acknowledged(false)
                .build());
    }

    private boolean isAcknowledged(LotteryCalendarState.Reminder reminder) {
        return acknowledgementRepository.findByReminderKeyAndFingerprint(reminder.getKey(), reminder.getFingerprint()).isPresent();
    }

    private LocalDate resolveNextDrawDate(com.one.record.lottery.LotteryDraw latestDraw) {
        LocalDate anchor = parseDate(latestDraw == null ? null : latestDraw.getDrawDate());
        if (anchor == null) {
            anchor = LocalDate.now(clock);
            if (isDrawDay(anchor) && clock.millis() < millis(anchor.atTime(21, 30))) {
                return anchor;
            }
        }
        LocalDate next = anchor.plusDays(1);
        while (!isDrawDay(next)) {
            next = next.plusDays(1);
        }
        return next;
    }

    private LocalDate parseDate(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return LocalDate.parse(value.length() > 10 ? value.substring(0, 10) : value);
        } catch (DateTimeParseException exception) {
            log.debug("Ignoring invalid lottery draw date: {}", value);
            return null;
        }
    }

    private static boolean isDrawDay(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        return day == DayOfWeek.TUESDAY || day == DayOfWeek.THURSDAY || day == DayOfWeek.SUNDAY;
    }

    private long millis(LocalDateTime dateTime) {
        return dateTime.atZone(ZONE).toInstant().toEpochMilli();
    }

    private static String issueState(long now, long syncStartAt, long syncEndAt) {
        if (now < syncStartAt) {
            return "BEFORE_DRAW";
        }
        if (now <= syncEndAt) {
            return "WAITING_SYNC";
        }
        return "POST_SYNC_WINDOW";
    }

    private static String weekday(DayOfWeek day) {
        return switch (day) {
            case TUESDAY -> "周二";
            case THURSDAY -> "周四";
            case SUNDAY -> "周日";
            default -> day.toString();
        };
    }
}
