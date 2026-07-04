package com.one.record.service.impl;

import com.one.record.model.LotteryPreference;
import com.one.record.repository.LotteryPreferenceRepository;
import com.one.record.service.ILotteryPreferenceService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class LotteryPreferenceService implements ILotteryPreferenceService {

    private static final String DEFAULT_USER_ID = "default";

    private static final String DEFAULT_TRAINING_SCALE = "standard";

    private static final int DEFAULT_REPLAY_COUNT = 0;

    private static final String DEFAULT_TICKET_SOURCE = "MANUAL";

    private static final int DEFAULT_BUDGET_REMINDER_PERCENT = 80;

    private static final int DEFAULT_REMINDER_DRAW_WINDOW_HOURS = 12;

    private static final int DEFAULT_REMINDER_SNOOZE_MINUTES = 60;

    private final LotteryPreferenceRepository repository;

    @Override
    public LotteryPreference preference() {
        return repository.findByUserId(DEFAULT_USER_ID).orElseGet(this::defaultPreference);
    }

    @Override
    public LotteryPreference updatePreference(LotteryPreference preference) {
        Long now = System.currentTimeMillis();
        LotteryPreference target = repository.findByUserId(DEFAULT_USER_ID)
                .orElseGet(() -> defaultPreference(now));
        target.setDefaultTrainingScale(normalizeScale(preference == null ? null : preference.getDefaultTrainingScale()));
        target.setDefaultReplayCount(normalizeReplayCount(preference == null ? null : preference.getDefaultReplayCount()));
        target.setAutoSavePredictions(preference != null && Boolean.TRUE.equals(preference.getAutoSavePredictions()));
        target.setDefaultTicketSource(normalizeTicketSource(preference == null ? null : preference.getDefaultTicketSource()));
        target.setWeeklyBudget(normalizeBudget(preference == null ? null : preference.getWeeklyBudget()));
        target.setMonthlyBudget(normalizeBudget(preference == null ? null : preference.getMonthlyBudget()));
        target.setMaxTicketsPerIssue(normalizePositiveInteger(preference == null ? null : preference.getMaxTicketsPerIssue()));
        target.setBudgetReminderPercent(normalizeReminderPercent(preference == null ? null : preference.getBudgetReminderPercent()));
        target.setReminderDrawWindowHours(normalizeReminderDrawWindowHours(preference == null ? null : preference.getReminderDrawWindowHours()));
        target.setReminderDefaultSnoozeMinutes(normalizeSnoozeMinutes(preference == null ? null : preference.getReminderDefaultSnoozeMinutes()));
        target.setMonthEndExportChecklistEnabled(preference == null || !Boolean.FALSE.equals(preference.getMonthEndExportChecklistEnabled()));
        target.setWorkbenchWidgetOrder(normalizeWidgetKeys(preference == null ? null : preference.getWorkbenchWidgetOrder()));
        target.setHiddenWorkbenchWidgets(normalizeWidgetKeys(preference == null ? null : preference.getHiddenWorkbenchWidgets()));
        target.setUpdatedAt(now);
        return repository.save(target);
    }

    private LotteryPreference defaultPreference() {
        return defaultPreference(System.currentTimeMillis());
    }

    private LotteryPreference defaultPreference(Long now) {
        return LotteryPreference.builder()
                .userId(DEFAULT_USER_ID)
                .defaultTrainingScale(DEFAULT_TRAINING_SCALE)
                .defaultReplayCount(DEFAULT_REPLAY_COUNT)
                .autoSavePredictions(false)
                .defaultTicketSource(DEFAULT_TICKET_SOURCE)
                .weeklyBudget(null)
                .monthlyBudget(null)
                .maxTicketsPerIssue(null)
                .budgetReminderPercent(DEFAULT_BUDGET_REMINDER_PERCENT)
                .reminderDrawWindowHours(DEFAULT_REMINDER_DRAW_WINDOW_HOURS)
                .reminderDefaultSnoozeMinutes(DEFAULT_REMINDER_SNOOZE_MINUTES)
                .monthEndExportChecklistEnabled(true)
                .workbenchWidgetOrder(List.of())
                .hiddenWorkbenchWidgets(List.of())
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private String normalizeScale(String scale) {
        return StringUtils.hasText(scale) ? scale.trim().toLowerCase() : DEFAULT_TRAINING_SCALE;
    }

    private Integer normalizeReplayCount(Integer replayCount) {
        return replayCount == null || replayCount < 0 ? DEFAULT_REPLAY_COUNT : replayCount;
    }

    private String normalizeTicketSource(String source) {
        return StringUtils.hasText(source) ? source.trim().toUpperCase() : DEFAULT_TICKET_SOURCE;
    }

    private BigDecimal normalizeBudget(BigDecimal value) {
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private Integer normalizePositiveInteger(Integer value) {
        return value == null || value <= 0 ? null : value;
    }

    private Integer normalizeReminderPercent(Integer value) {
        if (value == null || value <= 0) {
            return DEFAULT_BUDGET_REMINDER_PERCENT;
        }
        return Math.min(100, value);
    }

    private Integer normalizeReminderDrawWindowHours(Integer value) {
        if (value == null || value <= 0) {
            return DEFAULT_REMINDER_DRAW_WINDOW_HOURS;
        }
        return Math.min(72, value);
    }

    private Integer normalizeSnoozeMinutes(Integer value) {
        if (value == null || value <= 0) {
            return DEFAULT_REMINDER_SNOOZE_MINUTES;
        }
        return Math.min(7 * 24 * 60, value);
    }

    private List<String> normalizeWidgetKeys(List<String> widgetKeys) {
        if (widgetKeys == null || widgetKeys.isEmpty()) {
            return new ArrayList<>();
        }
        return widgetKeys.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .limit(30)
                .toList();
    }
}
