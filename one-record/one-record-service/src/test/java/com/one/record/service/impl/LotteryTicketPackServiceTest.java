package com.one.record.service.impl;

import com.one.record.lottery.LotteryTicketBatchSaveResult;
import com.one.record.lottery.LotteryTicketBudgetPrecheckResult;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryDecisionCandidateSelection;
import com.one.record.model.LotteryDecisionSet;
import com.one.record.model.LotteryTicket;
import com.one.record.model.LotteryTicketPack;
import com.one.record.model.LotteryTicketPackItem;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryDecisionSetRepository;
import com.one.record.repository.LotteryTicketPackRepository;
import com.one.record.service.ILotteryTicketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryTicketPackServiceTest {

    private LotteryTicketPackRepository repository;

    private LotteryDecisionSetRepository decisionSetRepository;

    private ILotteryTicketService ticketService;

    private LotteryAuditEventRepository auditEventRepository;

    private LotteryTicketPackService service;

    @BeforeEach
    void setUp() {
        repository = mock(LotteryTicketPackRepository.class);
        decisionSetRepository = mock(LotteryDecisionSetRepository.class);
        ticketService = mock(ILotteryTicketService.class);
        auditEventRepository = mock(LotteryAuditEventRepository.class);
        when(repository.save(any(LotteryTicketPack.class))).thenAnswer(invocation -> {
            LotteryTicketPack pack = invocation.getArgument(0);
            if (pack.getId() == null) {
                pack.setId("pack-1");
            }
            return pack;
        });
        when(auditEventRepository.save(any(LotteryAuditEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(ticketService.budgetPrecheck(any())).thenReturn(LotteryTicketBudgetPrecheckResult.builder()
                .status("OK")
                .proposedCost(new BigDecimal("2.00"))
                .build());
        service = new LotteryTicketPackService(repository, decisionSetRepository, ticketService, auditEventRepository);
    }

    @Test
    void previewBuildsPackFromDecisionSetWithoutSavingDraft() {
        when(decisionSetRepository.findByIdAndUserId("decision-1", "default")).thenReturn(Optional.of(LotteryDecisionSet.builder()
                .id("decision-1")
                .title("2026068 决策")
                .targetIssue("2026068")
                .selectedCandidates(List.of(LotteryDecisionCandidateSelection.builder()
                        .key("candidate-1")
                        .candidateTitle("稳态候选")
                        .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                        .blueNumber("07")
                        .ticketCount(2)
                        .build()))
                .build()));

        LotteryTicketPack result = service.preview(LotteryTicketPack.builder()
                .sourceType("DECISION_SET")
                .sourceId("decision-1")
                .targetIssue("2026068")
                .build());

        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getTargetIssue()).isEqualTo("2026068");
        assertThat(result.getItems().get(0).getDecisionSetId()).isEqualTo("decision-1");
        assertThat(result.getBudgetPrecheck().getStatus()).isEqualTo("OK");
        verify(repository, never()).save(any(LotteryTicketPack.class));
        verify(auditEventRepository).save(any(LotteryAuditEvent.class));
    }

    @Test
    void approveAndSaveAsTicketsUpdatesPackAndWritesAuditTrail() {
        LotteryTicketPack draft = LotteryTicketPack.builder()
                .id("pack-1")
                .userId("default")
                .title("沙盘票包")
                .targetIssue("2026068")
                .status("DRAFT")
                .approvalState("PENDING")
                .items(List.of(LotteryTicketPackItem.builder()
                        .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                        .blueNumber("07")
                        .quantity(1)
                        .cost(new BigDecimal("2.00"))
                        .build()))
                .createdAt(100L)
                .build();
        when(repository.findByIdAndUserId("pack-1", "default")).thenReturn(Optional.of(draft));
        when(ticketService.saveTickets(any())).thenReturn(LotteryTicketBatchSaveResult.builder()
                .savedTickets(List.of(LotteryTicket.builder().id("ticket-1").build()))
                .budgetPrecheck(LotteryTicketBudgetPrecheckResult.builder().status("OK").build())
                .build());

        LotteryTicketPack approved = service.approve("pack-1");
        assertThat(approved.getApprovalState()).isEqualTo("APPROVED");

        LotteryTicketPack saved = service.saveAsTickets("pack-1");
        assertThat(saved.getStatus()).isEqualTo("SAVED");
        assertThat(saved.getSavedTicketIds()).containsExactly("ticket-1");

        ArgumentCaptor<LotteryAuditEvent> auditCaptor = ArgumentCaptor.forClass(LotteryAuditEvent.class);
        verify(auditEventRepository, org.mockito.Mockito.atLeast(2)).save(auditCaptor.capture());
        assertThat(auditCaptor.getAllValues()).extracting(LotteryAuditEvent::getEventType)
                .contains("TICKET_PACK_APPROVE", "TICKET_PACK_SAVE_TICKETS");
    }

    @Test
    void ticketPacksUsesPageEnvelope() {
        when(repository.countByUserIdAndArchivedFalse("default")).thenReturn(1L);
        when(repository.findByUserIdAndArchivedFalseOrderByUpdatedAtDesc("default", PageRequest.of(0, 20)))
                .thenReturn(List.of(LotteryTicketPack.builder().id("pack-1").build()));

        var page = service.ticketPacks(false, 1, 20);

        assertThat(page.getItems()).hasSize(1);
        assertThat(page.getTotal()).isEqualTo(1);
    }
}
