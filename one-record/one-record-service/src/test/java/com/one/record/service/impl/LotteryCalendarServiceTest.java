package com.one.record.service.impl;

import com.one.record.lottery.LotteryCalendarState;
import com.one.record.lottery.LotteryDailyState;
import com.one.record.lottery.LotteryDraw;
import com.one.record.lottery.LotteryReminderAcknowledgeRequest;
import com.one.record.model.LotteryReminderAcknowledgement;
import com.one.record.repository.LotteryReminderAcknowledgementRepository;
import com.one.record.service.ILotteryWorkbenchService;
import com.one.record.service.IRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryCalendarServiceTest {

    private IRecordService recordService;

    private ILotteryWorkbenchService workbenchService;

    private LotteryReminderAcknowledgementRepository acknowledgementRepository;

    private LotteryCalendarService service;

    @BeforeEach
    void setUp() {
        recordService = mock(IRecordService.class);
        workbenchService = mock(ILotteryWorkbenchService.class);
        acknowledgementRepository = mock(LotteryReminderAcknowledgementRepository.class);
        service = new LotteryCalendarService(
                recordService,
                workbenchService,
                acknowledgementRepository,
                Clock.fixed(Instant.parse("2026-07-04T06:00:00Z"), ZoneId.of("Asia/Shanghai"))
        );
        when(recordService.findLastDraw()).thenReturn(LotteryDraw.builder()
                .issue("2026078")
                .drawDate("2026-07-02")
                .build());
        when(workbenchService.dailyState()).thenReturn(state(1));
        when(acknowledgementRepository.findByReminderKeyAndFingerprint(any(), any())).thenReturn(Optional.empty());
    }

    @Test
    void calendarBuildsNextDrawWindowAndPendingReminders() {
        LotteryCalendarState calendar = service.calendar();

        assertThat(calendar.getLatestIssue()).isEqualTo("2026078");
        assertThat(calendar.getNextIssue()).isEqualTo("2026079");
        assertThat(calendar.getNextDrawDate()).isEqualTo("2026-07-05");
        assertThat(calendar.getDrawWeekday()).isEqualTo("周日");
        assertThat(calendar.getCurrentIssueState()).isEqualTo("BEFORE_DRAW");
        assertThat(calendar.getExpectedSyncStartAt()).isLessThan(calendar.getExpectedSyncEndAt());
        assertThat(calendar.getReminders()).extracting("key").containsExactly("sync", "prediction", "tickets", "prize-check");
        assertThat(calendar.getReminders()).allSatisfy(reminder -> assertThat(reminder.getFingerprint()).isNotBlank());
    }

    @Test
    void acknowledgedReminderIsHiddenUntilFingerprintChanges() {
        LotteryCalendarState calendar = service.calendar();
        String fingerprint = calendar.getReminders().get(0).getFingerprint();
        when(acknowledgementRepository.findByReminderKeyAndFingerprint("sync", fingerprint))
                .thenReturn(Optional.of(LotteryReminderAcknowledgement.builder()
                        .reminderKey("sync")
                        .fingerprint(fingerprint)
                        .build()));

        LotteryCalendarState acknowledged = service.calendar();

        assertThat(acknowledged.getReminders()).extracting("key").doesNotContain("sync");

        when(workbenchService.dailyState()).thenReturn(state(2));
        LotteryCalendarState changed = service.calendar();

        assertThat(changed.getReminders()).extracting("key").contains("sync");
    }

    @Test
    void acknowledgePersistsReminderFingerprintAndReturnsFreshCalendar() {
        LotteryCalendarState calendar = service.acknowledge("tickets", LotteryReminderAcknowledgeRequest.builder()
                .fingerprint("tickets|PENDING|/lottery/tickets?issue=2026079|1")
                .build());

        assertThat(calendar.getNextIssue()).isEqualTo("2026079");
        verify(acknowledgementRepository).save(any(LotteryReminderAcknowledgement.class));
    }

    private static LotteryDailyState state(int pendingCount) {
        return LotteryDailyState.builder()
                .latestIssue("2026078")
                .nextIssue("2026079")
                .syncState(item("sync", "PENDING", "/lottery/sync", pendingCount))
                .predictionState(item("prediction", "PENDING", "/lottery/predictions/history?targetPeriod=2026079", 1))
                .ticketState(item("tickets", "PENDING", "/lottery/tickets?issue=2026079", 1))
                .prizeCheckState(item("prize-check", "PENDING", "/lottery/tickets?issue=2026078&status=BOUGHT", 1))
                .build();
    }

    private static LotteryDailyState.DailyStateItem item(String key, String status, String path, int pendingCount) {
        return LotteryDailyState.DailyStateItem.builder()
                .key(key)
                .label(key)
                .status(status)
                .message(key + " pending")
                .path(path)
                .pendingCount(pendingCount)
                .build();
    }
}
