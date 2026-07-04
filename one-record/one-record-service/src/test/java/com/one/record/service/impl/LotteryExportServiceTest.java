package com.one.record.service.impl;

import com.one.record.lottery.LotteryExportResult;
import com.one.record.lottery.LotteryIssueLedger;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryBacktestReportRepository;
import com.one.record.repository.LotteryPredictionSnapshotRepository;
import com.one.record.repository.LotteryProviderProbeLogRepository;
import com.one.record.repository.LotteryRecordSyncLogRepository;
import com.one.record.repository.LotteryStrategyExperimentRepository;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.service.ILotteryLedgerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryExportServiceTest {

    private LotteryTicketRepository ticketRepository;

    private LotteryAuditEventRepository auditEventRepository;

    private ILotteryLedgerService ledgerService;

    private LotteryExportService service;

    @BeforeEach
    void setUp() {
        ticketRepository = mock(LotteryTicketRepository.class);
        auditEventRepository = mock(LotteryAuditEventRepository.class);
        ledgerService = mock(ILotteryLedgerService.class);
        service = new LotteryExportService(
                ticketRepository,
                mock(LotteryPredictionSnapshotRepository.class),
                mock(LotteryStrategyExperimentRepository.class),
                mock(LotteryBacktestReportRepository.class),
                mock(LotteryRecordSyncLogRepository.class),
                mock(LotteryProviderProbeLogRepository.class),
                auditEventRepository,
                ledgerService
        );
        when(auditEventRepository.save(any(LotteryAuditEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void exportTicketsBuildsStableCsvAndAuditEvent() {
        when(ticketRepository.findAll(any(Sort.class))).thenReturn(List.of(
                LotteryTicket.builder()
                        .id("ticket-1")
                        .issue("2026079")
                        .status("BOUGHT")
                        .source("MANUAL")
                        .quantity(2)
                        .cost(new BigDecimal("4"))
                        .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                        .blueNumber("07")
                        .createdAt(100L)
                        .build(),
                LotteryTicket.builder()
                        .id("ticket-2")
                        .issue("2026079")
                        .status("DRAFT")
                        .source("MANUAL")
                        .quantity(1)
                        .cost(new BigDecimal("2"))
                        .build()
        ));
        ArgumentCaptor<LotteryAuditEvent> captor = ArgumentCaptor.forClass(LotteryAuditEvent.class);

        LotteryExportResult result = service.export("tickets", Map.of("status", "BOUGHT", "limit", "10"));

        assertThat(result.getExportType()).isEqualTo("tickets");
        assertThat(result.getRowCount()).isEqualTo(1);
        assertThat(result.getContent()).startsWith("id,issue,status,source,quantity,cost,redNumbers,blueNumber,prizeGrade,createdAt");
        assertThat(result.getContent()).contains("ticket-1,2026079,BOUGHT,MANUAL,2,4,01 02 03 04 05 06,07,,100");
        verify(auditEventRepository).save(captor.capture());
        assertThat(captor.getValue().getRowCount()).isEqualTo(1);
        assertThat(captor.getValue().getFilters()).containsEntry("status", "BOUGHT");
    }

    @Test
    void exportLedgerRowsUsesLedgerService() {
        when(ledgerService.issues()).thenReturn(List.of(LotteryIssueLedger.builder()
                .issue("2026079")
                .ticketCount(2)
                .totalCost(new BigDecimal("4"))
                .netResult(new BigDecimal("-4"))
                .build()));

        LotteryExportResult result = service.export("ledger-issues", Map.of("issue", "2026079"));

        assertThat(result.getRowCount()).isEqualTo(1);
        assertThat(result.getContent()).contains("2026079");
    }
}
