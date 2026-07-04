package com.one.record.service.impl;

import com.one.record.lottery.LotteryCalendarState;
import com.one.record.lottery.LotteryDailyState;
import com.one.record.lottery.LotteryDataQualityReport;
import com.one.record.lottery.LotteryDecisionOutcomeSummary;
import com.one.record.lottery.LotteryRecordSyncSummary;
import com.one.record.lottery.LotteryReminderAcknowledgeRequest;
import com.one.record.lottery.LotteryReminderSummary;
import com.one.record.lottery.LotteryTicketSummary;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryPreference;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.service.ILotteryCalendarService;
import com.one.record.service.ILotteryDataQualityService;
import com.one.record.service.ILotteryDecisionSetService;
import com.one.record.service.ILotteryPreferenceService;
import com.one.record.service.ILotteryRecordSyncLogService;
import com.one.record.service.ILotteryTicketService;
import com.one.record.service.ILotteryWorkbenchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryReminderServiceTest {

    private ILotteryWorkbenchService workbenchService;

    private ILotteryCalendarService calendarService;

    private ILotteryRecordSyncLogService syncLogService;

    private ILotteryDataQualityService dataQualityService;

    private ILotteryTicketService ticketService;

    private ILotteryDecisionSetService decisionSetService;

    private ILotteryPreferenceService preferenceService;

    private LotteryAuditEventRepository auditEventRepository;

    private LotteryReminderService service;

    @BeforeEach
    void setUp() {
        workbenchService = mock(ILotteryWorkbenchService.class);
        calendarService = mock(ILotteryCalendarService.class);
        syncLogService = mock(ILotteryRecordSyncLogService.class);
        dataQualityService = mock(ILotteryDataQualityService.class);
        ticketService = mock(ILotteryTicketService.class);
        decisionSetService = mock(ILotteryDecisionSetService.class);
        preferenceService = mock(ILotteryPreferenceService.class);
        auditEventRepository = mock(LotteryAuditEventRepository.class);
        when(auditEventRepository.findByOrderByGeneratedAtDesc(PageRequest.of(0, 120))).thenReturn(List.of());
        when(auditEventRepository.save(any(LotteryAuditEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(preferenceService.preference()).thenReturn(LotteryPreference.builder()
                .reminderDrawWindowHours(12)
                .reminderDefaultSnoozeMinutes(45)
                .monthEndExportChecklistEnabled(true)
                .build());
        service = new LotteryReminderService(workbenchService, calendarService, syncLogService, dataQualityService,
                ticketService, decisionSetService, preferenceService, auditEventRepository);
    }

    @Test
    void summaryBuildsActiveRemindersFromDailyOperationsAndDecisionEvidence() {
        long now = System.currentTimeMillis();
        when(workbenchService.dailyState()).thenReturn(LotteryDailyState.builder()
                .syncState(LotteryDailyState.DailyStateItem.builder()
                        .status("PENDING")
                        .message("等待同步")
                        .pendingCount(1)
                        .path("/lottery/sync")
                        .updatedAt(now - 60_000)
                        .build())
                .predictionState(LotteryDailyState.DailyStateItem.builder().status("COMPLETE").build())
                .prizeCheckState(LotteryDailyState.DailyStateItem.builder().status("COMPLETE").build())
                .build());
        when(calendarService.calendar()).thenReturn(LotteryCalendarState.builder()
                .currentIssueState("BEFORE_DRAW")
                .nextIssue("2026069")
                .expectedSyncStartAt(now + 2 * 3_600_000L)
                .reminders(List.of(LotteryCalendarState.Reminder.builder()
                        .key("tickets")
                        .label("票据提醒")
                        .status("PENDING")
                        .message("开奖前录票")
                        .path("/lottery/tickets")
                        .fingerprint("calendar-ticket")
                        .dueAt(now)
                        .build()))
                .build());
        when(syncLogService.summary(50)).thenReturn(LotteryRecordSyncSummary.builder().latestStatus("FAILED").latestMessage("argument content is null").build());
        when(dataQualityService.report()).thenReturn(LotteryDataQualityReport.builder().missingIssueCount(1).generatedAt(now).build());
        when(ticketService.summary()).thenReturn(LotteryTicketSummary.builder().pendingTicketCount(2).generatedAt(now).build());
        when(decisionSetService.outcomeSummary(false, 30)).thenReturn(LotteryDecisionOutcomeSummary.builder()
                .savedDecisionSetCount(1)
                .convertedTicketCount(3)
                .checkedConvertedTicketCount(1)
                .staleEvidenceCount(1)
                .generatedAt(now)
                .build());

        LotteryReminderSummary summary = service.summary();

        assertThat(summary.getActiveCount()).isGreaterThanOrEqualTo(6);
        assertThat(summary.getDueCount()).isGreaterThanOrEqualTo(1);
        assertThat(summary.getItems()).extracting("key")
                .contains("upcoming-draw-window", "calendar-tickets", "sync-records", "sync-failed", "data-quality", "unchecked-tickets", "decision-unchecked", "decision-evidence");
    }

    @Test
    void acknowledgeAndSnoozeWriteAuditEvents() {
        when(workbenchService.dailyState()).thenReturn(LotteryDailyState.builder().build());
        when(calendarService.calendar()).thenReturn(LotteryCalendarState.builder().currentIssueState("BEFORE_DRAW").build());
        when(syncLogService.summary(50)).thenReturn(LotteryRecordSyncSummary.builder().latestStatus("SUCCESS").build());
        when(dataQualityService.report()).thenReturn(LotteryDataQualityReport.builder().build());
        when(ticketService.summary()).thenReturn(LotteryTicketSummary.builder().pendingTicketCount(0).build());
        when(decisionSetService.outcomeSummary(false, 30)).thenReturn(LotteryDecisionOutcomeSummary.builder().build());

        service.acknowledge("data-quality", LotteryReminderAcknowledgeRequest.builder()
                .fingerprint("data-quality|1")
                .note("done")
                .build());
        service.snooze("data-quality", LotteryReminderAcknowledgeRequest.builder()
                .fingerprint("data-quality|1")
                .snoozeMinutes(30)
                .build());

        ArgumentCaptor<LotteryAuditEvent> auditCaptor = ArgumentCaptor.forClass(LotteryAuditEvent.class);
        verify(auditEventRepository, org.mockito.Mockito.times(2)).save(auditCaptor.capture());
        assertThat(auditCaptor.getAllValues()).extracting("eventType")
                .containsExactly("LOTTERY_REMINDER_ACKNOWLEDGE", "LOTTERY_REMINDER_SNOOZE");
        assertThat(auditCaptor.getAllValues().get(1).getFilters()).containsKey("snoozeUntil");
    }
}
