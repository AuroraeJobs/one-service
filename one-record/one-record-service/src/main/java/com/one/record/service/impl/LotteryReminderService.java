package com.one.record.service.impl;

import com.one.record.lottery.LotteryCalendarState;
import com.one.record.lottery.LotteryDailyState;
import com.one.record.lottery.LotteryDataQualityReport;
import com.one.record.lottery.LotteryDecisionOutcomeSummary;
import com.one.record.lottery.LotteryRecordSyncSummary;
import com.one.record.lottery.LotteryReminderAcknowledgeRequest;
import com.one.record.lottery.LotteryReminderItem;
import com.one.record.lottery.LotteryReminderSummary;
import com.one.record.model.LotteryPreference;
import com.one.record.lottery.LotteryTicketSummary;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.service.ILotteryCalendarService;
import com.one.record.service.ILotteryDataQualityService;
import com.one.record.service.ILotteryDecisionSetService;
import com.one.record.service.ILotteryPreferenceService;
import com.one.record.service.ILotteryRecordSyncLogService;
import com.one.record.service.ILotteryReminderService;
import com.one.record.service.ILotteryTicketService;
import com.one.record.service.ILotteryWorkbenchService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@AllArgsConstructor
public class LotteryReminderService implements ILotteryReminderService {

    private static final int RECENT_AUDIT_LIMIT = 120;

    private static final String ACK_EVENT = "LOTTERY_REMINDER_ACKNOWLEDGE";

    private static final String SNOOZE_EVENT = "LOTTERY_REMINDER_SNOOZE";

    private final ILotteryWorkbenchService workbenchService;

    private final ILotteryCalendarService calendarService;

    private final ILotteryRecordSyncLogService syncLogService;

    private final ILotteryDataQualityService dataQualityService;

    private final ILotteryTicketService ticketService;

    private final ILotteryDecisionSetService decisionSetService;

    private final ILotteryPreferenceService preferenceService;

    private final LotteryAuditEventRepository auditEventRepository;

    @Override
    public LotteryReminderSummary summary() {
        long now = System.currentTimeMillis();
        List<LotteryAuditEvent> actions = auditEventRepository.findByOrderByGeneratedAtDesc(PageRequest.of(0, RECENT_AUDIT_LIMIT));
        List<LotteryReminderItem> reminders = new ArrayList<>();
        LotteryDailyState dailyState = workbenchService.dailyState();
        LotteryCalendarState calendar = calendarService.calendar();
        LotteryRecordSyncSummary syncSummary = syncLogService.summary(50);
        LotteryDataQualityReport qualityReport = dataQualityService.report();
        LotteryTicketSummary ticketSummary = ticketService.summary();
        LotteryDecisionOutcomeSummary outcomeSummary = decisionSetService.outcomeSummary(false, 30);
        LotteryPreference preference = preferenceService.preference();
        Integer defaultSnoozeMinutes = preference == null ? null : preference.getReminderDefaultSnoozeMinutes();

        addUpcomingDrawReminder(reminders, calendar, preference, now);
        addCalendarReminders(reminders, calendar);
        addDailyReminder(reminders, "sync-records", "同步", "开奖记录未同步", dailyState.getSyncState());
        addDailyReminder(reminders, "prepare-prediction", "预测", "下一期预测未完成", dailyState.getPredictionState());
        addDailyReminder(reminders, "check-tickets", "票据", "票据等待核验", dailyState.getPrizeCheckState());
        addSyncReminder(reminders, syncSummary);
        addQualityReminder(reminders, qualityReport);
        addTicketReminder(reminders, ticketSummary);
        addDecisionReminders(reminders, outcomeSummary);
        addMonthEndExportReminder(reminders, actions, preference, now);

        reminders = reminders.stream()
                .map(item -> decorateActionState(item, actions, now, defaultSnoozeMinutes))
                .sorted(Comparator.comparing((LotteryReminderItem item) -> item.getDueAt() == null ? Long.MAX_VALUE : item.getDueAt())
                        .thenComparing(item -> Objects.toString(item.getGroup(), ""))
                        .thenComparing(item -> Objects.toString(item.getTitle(), "")))
                .toList();
        int acknowledged = (int) reminders.stream().filter(item -> item.getAcknowledgedAt() != null).count();
        int snoozed = (int) reminders.stream().filter(item -> item.getSnoozedUntil() != null && item.getSnoozedUntil() > now).count();
        int active = (int) reminders.stream().filter(item -> item.getAcknowledgedAt() == null && (item.getSnoozedUntil() == null || item.getSnoozedUntil() <= now)).count();
        int due = (int) reminders.stream().filter(item -> item.getAcknowledgedAt() == null && (item.getSnoozedUntil() == null || item.getSnoozedUntil() <= now)
                && item.getDueAt() != null && item.getDueAt() <= now).count();
        return LotteryReminderSummary.builder()
                .totalCount(reminders.size())
                .activeCount(active)
                .dueCount(due)
                .snoozedCount(snoozed)
                .acknowledgedCount(acknowledged)
                .items(reminders)
                .generatedAt(now)
                .build();
    }

    @Override
    public LotteryReminderSummary acknowledge(String key, LotteryReminderAcknowledgeRequest request) {
        writeAction(ACK_EVENT, key, request, null);
        return summary();
    }

    @Override
    public LotteryReminderSummary snooze(String key, LotteryReminderAcknowledgeRequest request) {
        long now = System.currentTimeMillis();
        int minutes = request != null && request.getSnoozeMinutes() != null && request.getSnoozeMinutes() > 0
                ? Math.min(request.getSnoozeMinutes(), 7 * 24 * 60)
                : safeInt(preferenceService.preference().getReminderDefaultSnoozeMinutes(), 60);
        long snoozeUntil = request != null && request.getSnoozeUntil() != null && request.getSnoozeUntil() > now
                ? request.getSnoozeUntil()
                : now + minutes * 60_000L;
        writeAction(SNOOZE_EVENT, key, request, snoozeUntil);
        return summary();
    }

    private void addCalendarReminders(List<LotteryReminderItem> reminders, LotteryCalendarState calendar) {
        if (calendar == null || calendar.getReminders() == null) {
            return;
        }
        calendar.getReminders().forEach(item -> reminders.add(reminder(
                "calendar-" + item.getKey(),
                "开奖日历",
                item.getLabel(),
                item.getMessage(),
                item.getStatus(),
                item.getPath(),
                item.getDueAt(),
                item.getFingerprint()
        )));
    }

    private void addUpcomingDrawReminder(List<LotteryReminderItem> reminders, LotteryCalendarState calendar, LotteryPreference preference, long now) {
        if (calendar == null || calendar.getExpectedSyncStartAt() == null || !"BEFORE_DRAW".equals(calendar.getCurrentIssueState())) {
            return;
        }
        int windowHours = safeInt(preference == null ? null : preference.getReminderDrawWindowHours(), 12);
        long remindAt = calendar.getExpectedSyncStartAt() - windowHours * 3_600_000L;
        if (now < remindAt) {
            return;
        }
        reminders.add(reminder("upcoming-draw-window", "开奖准备", "下一期开奖进入准备窗口",
                "第 " + Objects.toString(calendar.getNextIssue(), "-") + " 期将在 " + windowHours + " 小时内进入同步窗口",
                "PENDING", "/lottery/workbench", remindAt,
                "upcoming-draw-window|" + Objects.toString(calendar.getNextIssue(), "")));
    }

    private void addDailyReminder(List<LotteryReminderItem> reminders, String key, String group, String title, LotteryDailyState.DailyStateItem item) {
        if (item == null || "COMPLETE".equals(item.getStatus())) {
            return;
        }
        reminders.add(reminder(key, group, title, item.getMessage(), item.getStatus(), item.getPath(), item.getUpdatedAt(),
                key + "|" + Objects.toString(item.getStatus(), "") + "|" + Objects.toString(item.getPendingCount(), "0")));
    }

    private void addSyncReminder(List<LotteryReminderItem> reminders, LotteryRecordSyncSummary summary) {
        if (summary == null || !"FAILED".equals(summary.getLatestStatus())) {
            return;
        }
        reminders.add(reminder("sync-failed", "同步", "最近同步失败",
                StringUtils.hasText(summary.getLatestMessage()) ? summary.getLatestMessage() : "最近一次开奖记录同步失败",
                "FAILED", "/lottery/sync", summary.getLatestFinishedAt(),
                "sync-failed|" + Objects.toString(summary.getLatestStartIssue(), "") + "|" + Objects.toString(summary.getLatestEndIssue(), "")));
    }

    private void addQualityReminder(List<LotteryReminderItem> reminders, LotteryDataQualityReport report) {
        int issueCount = qualityIssueCount(report);
        if (issueCount <= 0) {
            return;
        }
        reminders.add(reminder("data-quality", "数据质量", "数据质量待修复",
                "发现 " + issueCount + " 项数据质量问题", "WARNING", "/lottery/data-quality",
                report == null ? null : report.getGeneratedAt(), "data-quality|" + issueCount));
    }

    private void addTicketReminder(List<LotteryReminderItem> reminders, LotteryTicketSummary summary) {
        int pending = summary == null ? 0 : safeInt(summary.getPendingTicketCount(), 0);
        if (pending <= 0) {
            return;
        }
        reminders.add(reminder("unchecked-tickets", "票据", "票据等待核奖",
                "还有 " + pending + " 张票据待核奖", "PENDING", "/lottery/tickets", summary.getGeneratedAt(),
                "unchecked-tickets|" + pending));
    }

    private void addDecisionReminders(List<LotteryReminderItem> reminders, LotteryDecisionOutcomeSummary summary) {
        if (summary == null) {
            return;
        }
        int unchecked = Math.max(0, safeInt(summary.getConvertedTicketCount(), 0) - safeInt(summary.getCheckedConvertedTicketCount(), 0));
        if (unchecked > 0) {
            reminders.add(reminder("decision-unchecked", "决策复盘", "保存决策转票待核奖",
                    "还有 " + unchecked + " 张保存决策转出的票据待核奖", "PENDING", "/lottery/predictions/decision",
                    summary.getGeneratedAt(), "decision-unchecked|" + unchecked));
        }
        int evidence = safeInt(summary.getStaleEvidenceCount(), 0) + safeInt(summary.getVolatileEvidenceCount(), 0);
        if (evidence > 0) {
            reminders.add(reminder("decision-evidence", "证据复核", "决策证据需要复核",
                    "发现 " + evidence + " 项过期或波动证据", "WARNING", "/lottery/research",
                    summary.getGeneratedAt(), "decision-evidence|" + evidence));
        }
        int saved = safeInt(summary.getSavedDecisionSetCount(), 0);
        int converted = safeInt(summary.getConvertedTicketCount(), 0);
        if (saved > 0 && converted <= 0) {
            reminders.add(reminder("decision-unconverted", "决策复盘", "保存决策尚未转票",
                    "已有保存决策，但还没有转换为票据", "PENDING", "/lottery/predictions/decision",
                    summary.getGeneratedAt(), "decision-unconverted|" + saved));
        }
    }

    private void addMonthEndExportReminder(List<LotteryReminderItem> reminders, List<LotteryAuditEvent> actions, LotteryPreference preference, long now) {
        boolean enabled = preference == null || !Boolean.FALSE.equals(preference.getMonthEndExportChecklistEnabled());
        if (!enabled) {
            return;
        }
        java.time.LocalDate date = java.time.Instant.ofEpochMilli(now)
                .atZone(java.time.ZoneId.of("Asia/Shanghai"))
                .toLocalDate();
        if (date.getDayOfMonth() < 25) {
            return;
        }
        String month = date.withDayOfMonth(1).toString().substring(0, 7);
        boolean exported = actions.stream().anyMatch(event -> {
            if (event.getGeneratedAt() == null) {
                return false;
            }
            java.time.LocalDate eventDate = java.time.Instant.ofEpochMilli(event.getGeneratedAt())
                    .atZone(java.time.ZoneId.of("Asia/Shanghai"))
                    .toLocalDate();
            return eventDate.toString().startsWith(month)
                    && ("EXPORT".equals(event.getEventType()) || "REPORT_EXPORT".equals(event.getEventType()) || "decision-outcomes".equals(event.getTargetType()));
        });
        if (!exported) {
            reminders.add(reminder("month-end-export", "月末复盘", "月末导出清单待完成",
                    "本月还没有可追踪的复盘导出记录", "MANUAL", "/lottery/exports", now,
                    "month-end-export|" + month));
        }
    }

    private LotteryReminderItem decorateActionState(LotteryReminderItem item, List<LotteryAuditEvent> actions, long now, Integer defaultSnoozeMinutes) {
        LotteryAuditEvent ack = latestAction(actions, ACK_EVENT, item);
        LotteryAuditEvent snooze = latestAction(actions, SNOOZE_EVENT, item);
        Long snoozedUntil = snooze == null || snooze.getFilters() == null ? null : parseLong(snooze.getFilters().get("snoozeUntil"));
        String status = item.getStatus();
        if (ack != null) {
            status = "ACKNOWLEDGED";
        } else if (snoozedUntil != null && snoozedUntil > now) {
            status = "SNOOZED";
        }
        return LotteryReminderItem.builder()
                .key(item.getKey())
                .group(item.getGroup())
                .title(item.getTitle())
                .message(item.getMessage())
                .status(status)
                .severity(severity(item.getStatus()))
                .path(item.getPath())
                .fingerprint(item.getFingerprint())
                .dueAt(item.getDueAt())
                .acknowledgedAt(ack == null ? null : ack.getGeneratedAt())
                .snoozedUntil(snoozedUntil)
                .build();
    }

    private LotteryAuditEvent latestAction(List<LotteryAuditEvent> actions, String eventType, LotteryReminderItem item) {
        return actions.stream()
                .filter(event -> eventType.equals(event.getEventType()))
                .filter(event -> Objects.equals(item.getKey(), event.getTargetId()))
                .filter(event -> event.getFilters() != null && Objects.equals(item.getFingerprint(), event.getFilters().get("fingerprint")))
                .max(Comparator.comparing(event -> event.getGeneratedAt() == null ? 0L : event.getGeneratedAt()))
                .orElse(null);
    }

    private void writeAction(String eventType, String key, LotteryReminderAcknowledgeRequest request, Long snoozeUntil) {
        if (!StringUtils.hasText(key) || request == null || !StringUtils.hasText(request.getFingerprint())) {
            throw new IllegalArgumentException("提醒标识不能为空");
        }
        Map<String, String> filters = new LinkedHashMap<>();
        filters.put("fingerprint", request.getFingerprint());
        filters.put("note", StringUtils.hasText(request.getNote()) ? request.getNote().trim() : "");
        if (snoozeUntil != null) {
            filters.put("snoozeUntil", String.valueOf(snoozeUntil));
            filters.put("snoozeMinutes", String.valueOf(request.getSnoozeMinutes() == null ? "" : request.getSnoozeMinutes()));
        }
        auditEventRepository.save(LotteryAuditEvent.builder()
                .eventType(eventType)
                .targetType("lottery-reminder")
                .targetId(key)
                .requesterScope("lottery-reminders")
                .filters(filters)
                .rowCount(1)
                .message(ACK_EVENT.equals(eventType) ? "Acknowledged lottery reminder" : "Snoozed lottery reminder")
                .generatedAt(System.currentTimeMillis())
                .build());
    }

    private LotteryReminderItem reminder(String key, String group, String title, String message, String status, String path, Long dueAt, String fingerprint) {
        return LotteryReminderItem.builder()
                .key(key)
                .group(group)
                .title(title)
                .message(message)
                .status(status)
                .severity(severity(status))
                .path(path)
                .dueAt(dueAt)
                .fingerprint(StringUtils.hasText(fingerprint) ? fingerprint : key + "|" + Objects.toString(status, ""))
                .build();
    }

    private static String severity(String status) {
        if ("FAILED".equals(status) || "WARNING".equals(status)) {
            return "WARNING";
        }
        if ("MANUAL".equals(status)) {
            return "INFO";
        }
        return "ACTION";
    }

    private static Long parseLong(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private static int qualityIssueCount(LotteryDataQualityReport report) {
        if (report == null) {
            return 0;
        }
        return safeInt(report.getMissingIssueCount(), 0)
                + safeInt(report.getDuplicateIssueCount(), 0)
                + safeInt(report.getMalformedRecordCount(), 0)
                + safeInt(report.getInvalidNumberCount(), 0)
                + safeInt(report.getOutOfOrderLineCount(), 0)
                + safeInt(report.getFutureDateCount(), 0)
                + safeInt(report.getStaleDerivedDataCount(), 0);
    }

    private static int safeInt(Integer value, int fallback) {
        return value == null ? fallback : value;
    }
}
