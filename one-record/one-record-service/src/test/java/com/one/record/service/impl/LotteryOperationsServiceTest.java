package com.one.record.service.impl;

import com.one.record.lottery.LotteryDataQualityReport;
import com.one.record.lottery.LotteryDecisionOutcomeSummary;
import com.one.record.lottery.LotteryDraw;
import com.one.record.lottery.LotteryOperationsHealthAcknowledgeRequest;
import com.one.record.lottery.LotteryOperationsHealthSummary;
import com.one.record.lottery.LotteryRecordSyncSummary;
import com.one.record.lottery.LotteryTicketSummary;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.service.ILotteryDataQualityService;
import com.one.record.service.ILotteryDecisionSetService;
import com.one.record.service.ILotteryRecordSyncLogService;
import com.one.record.service.ILotteryTicketService;
import com.one.record.service.IRecordService;
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

class LotteryOperationsServiceTest {

    private IRecordService recordService;

    private ILotteryRecordSyncLogService syncLogService;

    private ILotteryDataQualityService dataQualityService;

    private ILotteryTicketService ticketService;

    private ILotteryDecisionSetService decisionSetService;

    private LotteryAuditEventRepository auditEventRepository;

    private LotteryOperationsService service;

    @BeforeEach
    void setUp() {
        recordService = mock(IRecordService.class);
        syncLogService = mock(ILotteryRecordSyncLogService.class);
        dataQualityService = mock(ILotteryDataQualityService.class);
        ticketService = mock(ILotteryTicketService.class);
        decisionSetService = mock(ILotteryDecisionSetService.class);
        auditEventRepository = mock(LotteryAuditEventRepository.class);
        when(auditEventRepository.save(any(LotteryAuditEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        service = new LotteryOperationsService(recordService, syncLogService, dataQualityService, ticketService, decisionSetService, auditEventRepository);
    }

    @Test
    void healthBuildsContributorScoresAndWritesAuditEvent() {
        long now = System.currentTimeMillis();
        when(recordService.findLastDraw()).thenReturn(LotteryDraw.builder()
                .issue("2026068")
                .updatedAt(now)
                .build());
        when(syncLogService.summary(50)).thenReturn(LotteryRecordSyncSummary.builder()
                .totalCount(2)
                .latestStatus("SUCCESS")
                .latestMessage("ok")
                .latestFinishedAt(now)
                .build());
        when(dataQualityService.report()).thenReturn(LotteryDataQualityReport.builder()
                .totalRecords(68)
                .generatedAt(now)
                .build());
        when(ticketService.summary()).thenReturn(LotteryTicketSummary.builder()
                .ticketCount(2)
                .pendingTicketCount(0)
                .generatedAt(now)
                .build());
        when(decisionSetService.outcomeSummary(false, 30)).thenReturn(LotteryDecisionOutcomeSummary.builder()
                .convertedTicketCount(2)
                .checkedConvertedTicketCount(2)
                .warningCount(0)
                .generatedAt(now)
                .build());
        when(auditEventRepository.findByOrderByGeneratedAtDesc(PageRequest.of(0, 50))).thenReturn(List.of(
                LotteryAuditEvent.builder().eventType("EXPORT").targetType("decision-outcomes").generatedAt(now).build()
        ));

        LotteryOperationsHealthSummary summary = service.health();

        assertThat(summary.getStatus()).isEqualTo("PASS");
        assertThat(summary.getScore()).isGreaterThanOrEqualTo(90);
        assertThat(summary.getLatestIssue()).isEqualTo("2026068");
        assertThat(summary.getNextIssue()).isEqualTo("2026069");
        assertThat(summary.getContributors()).extracting("key")
                .containsExactly("provider-freshness", "record-sync", "data-quality", "ticket-settlement", "decision-outcomes", "export-evidence");
        ArgumentCaptor<LotteryAuditEvent> auditCaptor = ArgumentCaptor.forClass(LotteryAuditEvent.class);
        verify(auditEventRepository, org.mockito.Mockito.times(2)).save(auditCaptor.capture());
        assertThat(auditCaptor.getAllValues().get(0).getEventType()).isEqualTo("DATA_QUALITY_REFRESH");
        assertThat(auditCaptor.getAllValues().get(1).getEventType()).isEqualTo("LOTTERY_HEALTH_GENERATE");
        assertThat(auditCaptor.getAllValues().get(1).getFilters()).containsEntry("status", "PASS");
    }

    @Test
    void acknowledgeHealthWritesAuditEventAndReturnsFreshHealth() {
        when(recordService.findLastDraw()).thenReturn(LotteryDraw.builder().issue("2026068").updatedAt(System.currentTimeMillis()).build());
        when(syncLogService.summary(50)).thenReturn(LotteryRecordSyncSummary.builder().latestStatus("FAILED").totalCount(1).build());
        when(dataQualityService.report()).thenReturn(LotteryDataQualityReport.builder().missingIssueCount(2).build());
        when(ticketService.summary()).thenReturn(LotteryTicketSummary.builder().ticketCount(1).pendingTicketCount(1).build());
        when(decisionSetService.outcomeSummary(false, 30)).thenReturn(LotteryDecisionOutcomeSummary.builder()
                .convertedTicketCount(2)
                .checkedConvertedTicketCount(0)
                .warningCount(1)
                .build());
        when(auditEventRepository.findByOrderByGeneratedAtDesc(PageRequest.of(0, 50))).thenReturn(List.of());

        LotteryOperationsHealthSummary summary = service.acknowledgeHealth(LotteryOperationsHealthAcknowledgeRequest.builder()
                .contributorKey("data-quality")
                .note("reviewed")
                .build());

        assertThat(summary.getStatus()).isNotBlank();
        ArgumentCaptor<LotteryAuditEvent> auditCaptor = ArgumentCaptor.forClass(LotteryAuditEvent.class);
        verify(auditEventRepository, org.mockito.Mockito.times(3)).save(auditCaptor.capture());
        assertThat(auditCaptor.getAllValues().get(0).getEventType()).isEqualTo("LOTTERY_HEALTH_ACKNOWLEDGE");
        assertThat(auditCaptor.getAllValues().get(0).getTargetId()).isEqualTo("data-quality");
        assertThat(auditCaptor.getAllValues().get(1).getEventType()).isEqualTo("DATA_QUALITY_REFRESH");
        assertThat(auditCaptor.getAllValues().get(2).getEventType()).isEqualTo("LOTTERY_HEALTH_GENERATE");
    }
}
