package com.one.record.service.impl;

import com.one.record.lottery.LotteryAuditMetadata;
import com.one.common.exception.NotFoundException;
import com.one.record.lottery.LotteryTicketBudgetPrecheckRequest;
import com.one.record.lottery.LotteryTicketBulkOperationResult;
import com.one.record.lottery.LotteryTicketBulkPatchRequest;
import com.one.record.lottery.LotteryTicketImportPreviewRequest;
import com.one.record.lottery.LotteryTicketImportPreviewResult;
import com.one.record.lottery.LotteryPrizeResult;
import com.one.record.lottery.LotteryResearchProvenance;
import com.one.record.lottery.LotteryTicketBatchSaveRequest;
import com.one.record.lottery.LotteryTicketBatchSaveResult;
import com.one.record.lottery.LotteryTicketPrizeCheckSummary;
import com.one.record.lottery.LotteryTicketSummary;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryPreference;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.response.Record;
import com.one.record.service.ILotteryPreferenceService;
import com.one.record.service.IRecordService;
import com.one.record.training.LotteryActualRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryTicketServiceTest {

    private LotteryTicketRepository repository;

    private IRecordService recordService;

    private ILotteryPreferenceService preferenceService;

    private LotteryAuditEventRepository auditEventRepository;

    private LotteryTicketService service;

    @BeforeEach
    void setUp() {
        repository = mock(LotteryTicketRepository.class);
        recordService = mock(IRecordService.class);
        preferenceService = mock(ILotteryPreferenceService.class);
        auditEventRepository = mock(LotteryAuditEventRepository.class);
        service = new LotteryTicketService(repository, recordService, preferenceService, auditEventRepository);
        when(repository.findByUserIdOrderByPeriodDescCreatedAtDesc("default")).thenReturn(List.of());
        when(preferenceService.preference()).thenReturn(LotteryPreference.builder()
                .budgetReminderPercent(80)
                .build());
        when(auditEventRepository.save(org.mockito.ArgumentMatchers.any(LotteryAuditEvent.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void ticketsFiltersByIssueWhenProvided() {
        when(repository.findByUserIdAndIssueOrderByCreatedAtDesc("default", "2026001")).thenReturn(List.of());

        service.tickets(" 2026001 ", null, null, null, null);

        verify(repository).findByUserIdAndIssueOrderByCreatedAtDesc("default", "2026001");
    }

    @Test
    void ticketsFiltersByStatusSourceAndPrizeGrade() {
        when(repository.findByUserIdOrderByPeriodDescCreatedAtDesc("default")).thenReturn(List.of(
                LotteryTicket.builder().id("a").status("CHECKED").source("PREDICTION").prizeGrade("FIFTH").build(),
                LotteryTicket.builder().id("b").status("DRAFT").source("MANUAL").prizeGrade("NONE").build()
        ));

        List<LotteryTicket> tickets = service.tickets(null, "checked", "prediction", "fifth", null);

        assertThat(tickets).extracting(LotteryTicket::getId).containsExactly("a");
    }

    @Test
    void ticketsAppliesSecondaryFiltersAfterIssueQuery() {
        when(repository.findByUserIdAndIssueOrderByCreatedAtDesc("default", "2026001")).thenReturn(List.of(
                LotteryTicket.builder().id("a").status("CHECKED").source("PREDICTION").prizeGrade("FIFTH").build(),
                LotteryTicket.builder().id("b").status("CHECKED").source("MANUAL").prizeGrade("FIFTH").build()
        ));

        List<LotteryTicket> tickets = service.tickets("2026001", "checked", "prediction", "fifth", null);

        assertThat(tickets).extracting(LotteryTicket::getId).containsExactly("a");
    }

    @Test
    void ticketsCanQueryByPredictionSnapshotId() {
        when(repository.findByUserIdAndPredictionSnapshotIdOrderByCreatedAtDesc("default", "snapshot-1")).thenReturn(List.of(
                LotteryTicket.builder().id("a").predictionSnapshotId("snapshot-1").build()
        ));

        List<LotteryTicket> tickets = service.tickets(null, null, null, null, " snapshot-1 ");

        assertThat(tickets).extracting(LotteryTicket::getId).containsExactly("a");
    }

    @Test
    void ticketsPageFiltersByCreatedRangeAndPaginates() {
        when(repository.findByUserIdOrderByPeriodDescCreatedAtDesc("default")).thenReturn(List.of(
                LotteryTicket.builder().id("a").status("DRAFT").createdAt(100L).build(),
                LotteryTicket.builder().id("b").status("DRAFT").createdAt(200L).build(),
                LotteryTicket.builder().id("c").status("DRAFT").createdAt(300L).build()
        ));

        var page = service.ticketsPage(null, "draft", null, null, null, 150L, 350L, 0, 1);

        assertThat(page.getItems()).extracting(LotteryTicket::getId).containsExactly("b");
        assertThat(page.getPage()).isZero();
        assertThat(page.getPageSize()).isEqualTo(1);
        assertThat(page.getTotal()).isEqualTo(2);
        assertThat(page.getHasNext()).isTrue();
    }

    @Test
    void saveTicketNormalizesNumbersAndDefaults() {
        ArgumentCaptor<LotteryTicket> captor = ArgumentCaptor.forClass(LotteryTicket.class);
        when(repository.save(captor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        LotteryTicket saved = service.saveTicket(LotteryTicket.builder()
                .issue("2026001")
                .redNumbers(List.of("6", "01", "33", "16", "17", "02"))
                .blueNumber("7")
                .quantity(2)
                .source("prediction")
                .build());

        assertThat(saved.getUserId()).isEqualTo("default");
        assertThat(saved.getIssue()).isEqualTo("2026001");
        assertThat(saved.getPeriod()).isEqualTo(2026001L);
        assertThat(saved.getRedNumbers()).containsExactly("01", "02", "06", "16", "17", "33");
        assertThat(saved.getBlueNumber()).isEqualTo("07");
        assertThat(saved.getQuantity()).isEqualTo(2);
        assertThat(saved.getCost()).isEqualByComparingTo("4");
        assertThat(saved.getSource()).isEqualTo("PREDICTION");
        assertThat(saved.getStatus()).isEqualTo("DRAFT");
        assertThat(saved.getAuditMetadata().getAction()).isEqualTo("ticket-save");
        assertThat(saved.getAuditMetadata().getRequesterScope()).isEqualTo("default");
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void saveTicketPreservesCompleteResearchLineage() {
        LotteryResearchProvenance provenance = LotteryResearchProvenance.builder()
                .sourceType("MINIGPT")
                .generationId("generation-1")
                .batchId("batch-1")
                .runId("run-1")
                .build();
        when(repository.save(org.mockito.ArgumentMatchers.any(LotteryTicket.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LotteryTicket saved = service.saveTicket(LotteryTicket.builder()
                .issue("2026079")
                .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                .blueNumber("07")
                .source("MINIGPT")
                .ticketPackId("pack-1")
                .decisionSetId("decision-1")
                .candidateKey("candidate-1")
                .generationId("generation-1")
                .provenance(provenance)
                .build());

        assertThat(saved.getTicketPackId()).isEqualTo("pack-1");
        assertThat(saved.getDecisionSetId()).isEqualTo("decision-1");
        assertThat(saved.getCandidateKey()).isEqualTo("candidate-1");
        assertThat(saved.getGenerationId()).isEqualTo("generation-1");
        assertThat(saved.getProvenance()).isNotSameAs(provenance);
        assertThat(saved.getProvenance().getBatchId()).isEqualTo("batch-1");
    }

    @Test
    void saveTicketReturnsExistingDuplicateWhenSameIssueAndNumbersExist() {
        LotteryTicket existing = LotteryTicket.builder().id("existing").issue("2026001").build();
        when(repository.findFirstByUserIdAndIssueAndRedNumbersAndBlueNumber(
                "default", "2026001", List.of("01", "02", "03", "04", "05", "06"), "07"))
                .thenReturn(Optional.of(existing));

        LotteryTicket saved = service.saveTicket(LotteryTicket.builder()
                .issue("2026001")
                .redNumbers(List.of("06", "05", "04", "03", "02", "01"))
                .blueNumber("7")
                .build());

        assertThat(saved.getId()).isEqualTo("existing");
        verify(repository, org.mockito.Mockito.never()).save(org.mockito.ArgumentMatchers.any(LotteryTicket.class));
    }

    @Test
    void saveTicketKeepsManualTicketPackNumberDeduplicationSemantics() {
        LotteryTicket existing = LotteryTicket.builder().id("existing").issue("2026001").build();
        when(repository.findFirstByUserIdAndIssueAndRedNumbersAndBlueNumber(
                "default", "2026001", List.of("01", "02", "03", "04", "05", "06"), "07"))
                .thenReturn(Optional.of(existing));

        LotteryTicket saved = service.saveTicket(LotteryTicket.builder()
                .issue("2026001")
                .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                .blueNumber("07")
                .source("TICKET_PACK")
                .ticketPackId("manual-pack-1")
                .candidateKey("01-02-03-04-05-06+07")
                .build());

        assertThat(saved.getId()).isEqualTo("existing");
        verify(repository, org.mockito.Mockito.never()).save(org.mockito.ArgumentMatchers.any(LotteryTicket.class));
    }

    @Test
    void saveTicketsSkipsExistingAndInBatchDuplicates() {
        when(repository.findFirstByUserIdAndIssueAndRedNumbersAndBlueNumber(
                "default", "2026001", List.of("01", "02", "03", "04", "05", "06"), "07"))
                .thenReturn(Optional.empty());
        when(repository.findFirstByUserIdAndIssueAndRedNumbersAndBlueNumber(
                "default", "2026001", List.of("01", "02", "03", "04", "05", "08"), "09"))
                .thenReturn(Optional.of(LotteryTicket.builder().id("existing").issue("2026001").build()));
        when(repository.save(org.mockito.ArgumentMatchers.any(LotteryTicket.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LotteryTicketBatchSaveResult result = service.saveTickets(LotteryTicketBatchSaveRequest.builder()
                .tickets(List.of(
                        ticket("2026001", List.of("01", "02", "03", "04", "05", "06"), "07"),
                        ticket("2026001", List.of("06", "05", "04", "03", "02", "01"), "07"),
                        ticket("2026001", List.of("01", "02", "03", "04", "05", "08"), "09")
                ))
                .build());

        assertThat(result.getRequestedCount()).isEqualTo(3);
        assertThat(result.getSavedCount()).isEqualTo(1);
        assertThat(result.getDuplicateCount()).isEqualTo(2);
        assertThat(result.getSavedTickets()).hasSize(1);
        assertThat(result.getDuplicateTickets()).hasSize(2);
        assertThat(result.getBudgetPrecheck()).isNotNull();
        verify(auditEventRepository).save(org.mockito.ArgumentMatchers.any(LotteryAuditEvent.class));
    }

    @Test
    void saveTicketsDoesNotLetManualSameNumberTicketSwallowResearchLineage() {
        List<String> redNumbers = List.of("01", "02", "03", "04", "05", "06");
        LotteryTicket manualTicket = LotteryTicket.builder()
                .id("manual-existing")
                .issue("2026079")
                .redNumbers(redNumbers)
                .blueNumber("07")
                .source("MANUAL")
                .build();
        when(repository.findByUserIdAndIssueAndRedNumbersAndBlueNumber(
                "default", "2026079", redNumbers, "07"))
                .thenReturn(List.of(manualTicket));
        when(repository.save(org.mockito.ArgumentMatchers.any(LotteryTicket.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LotteryTicketBatchSaveResult result = service.saveTickets(LotteryTicketBatchSaveRequest.builder()
                .tickets(List.of(researchTicket("candidate-1", "generation-1")))
                .build());

        assertThat(result.getSavedCount()).isEqualTo(1);
        assertThat(result.getDuplicateCount()).isZero();
        assertThat(result.getSavedTickets()).singleElement().satisfies(saved -> {
            assertThat(saved.getTicketPackId()).isEqualTo("pack-1");
            assertThat(saved.getDecisionSetId()).isEqualTo("decision-1");
            assertThat(saved.getCandidateKey()).isEqualTo("candidate-1");
            assertThat(saved.getGenerationId()).isEqualTo("generation-1");
        });
    }

    @Test
    void saveTicketsKeepsSameNumberResearchTicketsForDifferentCandidatesAndGenerations() {
        List<String> redNumbers = List.of("01", "02", "03", "04", "05", "06");
        when(repository.findByUserIdAndIssueAndRedNumbersAndBlueNumber(
                "default", "2026079", redNumbers, "07"))
                .thenReturn(List.of());
        when(repository.save(org.mockito.ArgumentMatchers.any(LotteryTicket.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LotteryTicketBatchSaveResult result = service.saveTickets(LotteryTicketBatchSaveRequest.builder()
                .tickets(List.of(
                        researchTicket("candidate-1", "generation-1"),
                        researchTicket("candidate-2", "generation-2")
                ))
                .build());

        assertThat(result.getSavedCount()).isEqualTo(2);
        assertThat(result.getDuplicateCount()).isZero();
        assertThat(result.getSavedTickets())
                .extracting(LotteryTicket::getCandidateKey)
                .containsExactly("candidate-1", "candidate-2");
        assertThat(result.getSavedTickets())
                .extracting(LotteryTicket::getGenerationId)
                .containsExactly("generation-1", "generation-2");
    }

    @Test
    void saveTicketsStillDeduplicatesRepeatedResearchLineage() {
        List<String> redNumbers = List.of("01", "02", "03", "04", "05", "06");
        when(repository.findByUserIdAndIssueAndRedNumbersAndBlueNumber(
                "default", "2026079", redNumbers, "07"))
                .thenReturn(List.of());
        when(repository.save(org.mockito.ArgumentMatchers.any(LotteryTicket.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LotteryTicketBatchSaveResult result = service.saveTickets(LotteryTicketBatchSaveRequest.builder()
                .tickets(List.of(
                        researchTicket("candidate-1", "generation-1"),
                        researchTicket("candidate-1", "generation-1")
                ))
                .build());

        assertThat(result.getSavedCount()).isEqualTo(1);
        assertThat(result.getDuplicateCount()).isEqualTo(1);
    }

    @Test
    void importPreviewReturnsNormalizedRowsDuplicatesAndBudgetWarnings() {
        when(preferenceService.preference()).thenReturn(LotteryPreference.builder()
                .monthlyBudget(new BigDecimal("2.40"))
                .budgetReminderPercent(80)
                .build());
        when(repository.findFirstByUserIdAndIssueAndRedNumbersAndBlueNumber(
                "default", "2026001", List.of("01", "02", "03", "04", "05", "06"), "07"))
                .thenReturn(Optional.of(LotteryTicket.builder().id("existing").issue("2026001").build()));

        LotteryTicketImportPreviewResult result = service.importPreview(LotteryTicketImportPreviewRequest.builder()
                .content("""
                        2026001 01 02 03 04 05 06 07
                        2026001 01 02 03 04 05 08 09
                        2026001 08 05 04 03 02 01 09
                        2026001 01 02 03
                        """)
                .build());

        assertThat(result.getRequestedCount()).isEqualTo(4);
        assertThat(result.getValidCount()).isEqualTo(1);
        assertThat(result.getDuplicateExistingCount()).isEqualTo(1);
        assertThat(result.getDuplicateRequestCount()).isEqualTo(1);
        assertThat(result.getInvalidCount()).isEqualTo(1);
        assertThat(result.getRows()).extracting("status")
                .containsExactly("DUPLICATE_EXISTING", "VALID", "DUPLICATE_REQUEST", "INVALID");
        assertThat(result.getRows().get(1).getTicket().getRedNumbers()).containsExactly("01", "02", "03", "04", "05", "08");
        assertThat(result.getBudgetPrecheck().getStatus()).isEqualTo("WARNING");
        verify(auditEventRepository).save(org.mockito.ArgumentMatchers.any(LotteryAuditEvent.class));
    }

    @Test
    void budgetPrecheckProjectsIssueAndBudgetExposure() {
        when(preferenceService.preference()).thenReturn(LotteryPreference.builder()
                .weeklyBudget(new BigDecimal("4"))
                .monthlyBudget(new BigDecimal("10"))
                .maxTicketsPerIssue(2)
                .budgetReminderPercent(80)
                .build());
        when(repository.findByUserIdOrderByPeriodDescCreatedAtDesc("default")).thenReturn(List.of(
                LotteryTicket.builder().issue("2026001").quantity(1).cost(new BigDecimal("2")).createdAt(System.currentTimeMillis()).build()
        ));

        var result = service.budgetPrecheck(LotteryTicketBudgetPrecheckRequest.builder()
                .tickets(List.of(ticket("2026001", List.of("01", "02", "03", "04", "05", "06"), "07")))
                .build());

        assertThat(result.getProposedTicketCount()).isEqualTo(1);
        assertThat(result.getProjectedWeeklyCost()).isEqualByComparingTo("4");
        assertThat(result.getIssueExposures()).singleElement()
                .satisfies(exposure -> {
                    assertThat(exposure.getIssue()).isEqualTo("2026001");
                    assertThat(exposure.getProjectedTicketCount()).isEqualTo(2);
                });
        assertThat(result.getWarnings()).extracting("key").contains("weekly-budget");
    }

    @Test
    void bulkUpdateTicketsAppliesSparsePatchAndAudits() {
        LotteryTicket first = LotteryTicket.builder().id("a").userId("default").issue("2026001").quantity(1).status("DRAFT").createdAt(100L).build();
        LotteryTicket second = LotteryTicket.builder().id("b").userId("default").issue("2026001").quantity(1).status("DRAFT").createdAt(100L).build();
        when(repository.findByIdAndUserId("a", "default")).thenReturn(Optional.of(first));
        when(repository.findByIdAndUserId("b", "default")).thenReturn(Optional.of(second));
        when(repository.saveAll(org.mockito.ArgumentMatchers.anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        LotteryTicketBulkOperationResult result = service.bulkUpdateTickets(LotteryTicketBulkPatchRequest.builder()
                .ids(List.of("a", "b", "missing"))
                .issue("2026002")
                .quantity(3)
                .status("bought")
                .source("prediction")
                .note("批量确认")
                .build());

        assertThat(result.getRequestedCount()).isEqualTo(3);
        assertThat(result.getUpdatedCount()).isEqualTo(2);
        assertThat(result.getMissingIds()).containsExactly("missing");
        assertThat(result.getTickets()).allSatisfy(ticket -> {
            assertThat(ticket.getIssue()).isEqualTo("2026002");
            assertThat(ticket.getPeriod()).isEqualTo(2026002L);
            assertThat(ticket.getQuantity()).isEqualTo(3);
            assertThat(ticket.getStatus()).isEqualTo("BOUGHT");
            assertThat(ticket.getSource()).isEqualTo("PREDICTION");
            assertThat(ticket.getNote()).isEqualTo("批量确认");
            assertThat(ticket.getAuditMetadata().getAction()).isEqualTo("ticket-bulk-update");
        });
        verify(auditEventRepository).save(org.mockito.ArgumentMatchers.any(LotteryAuditEvent.class));
    }

    @Test
    void archiveTicketsMarksVoid() {
        LotteryTicket ticket = LotteryTicket.builder().id("a").userId("default").status("DRAFT").createdAt(100L).build();
        when(repository.findByIdAndUserId("a", "default")).thenReturn(Optional.of(ticket));
        when(repository.saveAll(org.mockito.ArgumentMatchers.anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        LotteryTicketBulkOperationResult result = service.archiveTickets(LotteryTicketBulkPatchRequest.builder()
                .ids(List.of("a"))
                .build());

        assertThat(result.getArchivedCount()).isEqualTo(1);
        assertThat(result.getTickets().get(0).getStatus()).isEqualTo("VOID");
        assertThat(result.getTickets().get(0).getAuditMetadata().getAction()).isEqualTo("ticket-bulk-archive");
    }

    @Test
    void deleteTicketsDeletesExistingAndTracksMissing() {
        LotteryTicket ticket = LotteryTicket.builder().id("a").userId("default").build();
        when(repository.findByIdAndUserId("a", "default")).thenReturn(Optional.of(ticket));

        LotteryTicketBulkOperationResult result = service.deleteTickets(LotteryTicketBulkPatchRequest.builder()
                .ids(List.of("a", "missing"))
                .build());

        assertThat(result.getDeletedCount()).isEqualTo(1);
        assertThat(result.getMissingIds()).containsExactly("missing");
        verify(repository).deleteAll(List.of(ticket));
        verify(auditEventRepository).save(org.mockito.ArgumentMatchers.any(LotteryAuditEvent.class));
    }

    @Test
    void updateTicketPreservesExistingIdentityAndCreatedAt() {
        when(repository.findByIdAndUserId("ticket-1", "default")).thenReturn(Optional.of(LotteryTicket.builder()
                .id("ticket-1")
                .userId("default")
                .ticketPackId("pack-1")
                .decisionSetId("decision-1")
                .candidateKey("candidate-1")
                .generationId("generation-1")
                .provenance(LotteryResearchProvenance.builder().sourceType("MINIGPT").batchId("batch-1").build())
                .createdAt(100L)
                .auditMetadata(LotteryAuditMetadata.builder()
                        .action("ticket-save")
                        .source("ticket-service")
                        .requesterScope("default")
                        .createdAt(90L)
                        .updatedAt(100L)
                        .build())
                .build()));
        when(repository.save(org.mockito.ArgumentMatchers.any(LotteryTicket.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LotteryTicket updated = service.updateTicket("ticket-1", LotteryTicket.builder()
                .issue("2026002")
                .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                .blueNumber("08")
                .cost(new BigDecimal("6"))
                .status("bought")
                .build());

        assertThat(updated.getId()).isEqualTo("ticket-1");
        assertThat(updated.getUserId()).isEqualTo("default");
        assertThat(updated.getCreatedAt()).isEqualTo(100L);
        assertThat(updated.getUpdatedAt()).isGreaterThan(100L);
        assertThat(updated.getStatus()).isEqualTo("BOUGHT");
        assertThat(updated.getCost()).isEqualByComparingTo("6");
        assertThat(updated.getAuditMetadata().getAction()).isEqualTo("ticket-update");
        assertThat(updated.getAuditMetadata().getCreatedAt()).isEqualTo(90L);
        assertThat(updated.getAuditMetadata().getUpdatedAt()).isGreaterThan(100L);
        assertThat(updated.getTicketPackId()).isEqualTo("pack-1");
        assertThat(updated.getDecisionSetId()).isEqualTo("decision-1");
        assertThat(updated.getCandidateKey()).isEqualTo("candidate-1");
        assertThat(updated.getGenerationId()).isEqualTo("generation-1");
        assertThat(updated.getProvenance().getBatchId()).isEqualTo("batch-1");
    }

    @Test
    void deleteTicketRequiresExistingTicket() {
        when(repository.findByIdAndUserId("missing", "default")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteTicket("missing"))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("彩票票据不存在");
    }

    @Test
    void checkPrizesUpdatesTicketsForActualPeriod() {
        LotteryTicket ticket = LotteryTicket.builder()
                .id("ticket-1")
                .issue("2026001")
                .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                .blueNumber("07")
                .build();
        when(repository.findByUserIdAndIssueOrderByCreatedAtDesc("default", "2026001"))
                .thenReturn(List.of(ticket));
        when(repository.saveAll(org.mockito.ArgumentMatchers.anyList()))
                .thenAnswer(invocation -> invocation.getArgument(0));
        LotteryActualRecord actual = new LotteryActualRecord();
        actual.setPeriod(2026001);
        actual.setRedNumbers(List.of("01", "02", "03", "08", "09", "10"));
        actual.setBlueNumber("07");

        List<LotteryTicket> checked = service.checkPrizes(actual);

        assertThat(checked).hasSize(1);
        assertThat(checked.get(0).getPrizeGrade()).isEqualTo("FIFTH");
        assertThat(checked.get(0).getPrizeResult().getPrizeName()).isEqualTo("五等奖");
        assertThat(checked.get(0).getStatus()).isEqualTo("CHECKED");
        assertThat(checked.get(0).getUpdatedAt()).isNotNull();
    }

    @Test
    void checkLatestPrizesUsesLatestRecordAndOnlyPendingTickets() {
        Record latest = new Record();
        latest.setCode("2026001");
        latest.setRed("01,02,03,04,05,06");
        latest.setBlue("07");
        when(recordService.findLast()).thenReturn(latest);
        when(repository.findByUserIdAndIssueOrderByCreatedAtDesc("default", "2026001"))
                .thenReturn(List.of(
                        LotteryTicket.builder()
                                .id("pending")
                                .issue("2026001")
                                .status("DRAFT")
                                .redNumbers(List.of("01", "02", "03", "04", "08", "09"))
                                .blueNumber("07")
                                .build(),
                        LotteryTicket.builder()
                                .id("checked")
                                .issue("2026001")
                                .status("CHECKED")
                                .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                                .blueNumber("07")
                                .build()
                ));
        when(repository.saveAll(org.mockito.ArgumentMatchers.anyList()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LotteryTicketPrizeCheckSummary summary = service.checkLatestPrizes();

        assertThat(summary.getIssue()).isEqualTo("2026001");
        assertThat(summary.getCheckedTicketCount()).isEqualTo(1);
        assertThat(summary.getWinningTicketCount()).isEqualTo(1);
        assertThat(summary.getTotalPrizeAmount()).isEqualTo(20000L);
    }

    @Test
    void summaryAggregatesTickets() {
        when(repository.findByUserIdOrderByPeriodDescCreatedAtDesc("default")).thenReturn(List.of(
                LotteryTicket.builder()
                        .status("CHECKED")
                        .cost(new BigDecimal("4"))
                        .prizeResult(LotteryPrizeResult.builder()
                                .prizeGrade("FIFTH")
                                .prizeAmount(1000L)
                                .winning(true)
                                .build())
                        .build(),
                LotteryTicket.builder()
                        .status("DRAFT")
                        .cost(new BigDecimal("2"))
                        .build()
        ));

        LotteryTicketSummary summary = service.summary();

        assertThat(summary.getTicketCount()).isEqualTo(2);
        assertThat(summary.getCheckedTicketCount()).isEqualTo(1);
        assertThat(summary.getPendingTicketCount()).isEqualTo(1);
        assertThat(summary.getWinningTicketCount()).isEqualTo(1);
        assertThat(summary.getTotalCost()).isEqualByComparingTo("6");
        assertThat(summary.getTotalPrizeAmount()).isEqualTo(1000L);
        assertThat(summary.getStatusDistribution()).containsEntry("CHECKED", 1).containsEntry("DRAFT", 1);
        assertThat(summary.getPrizeDistribution()).containsEntry("FIFTH", 1);
        assertThat(summary.getGeneratedAt()).isNotNull();
    }

    private static LotteryTicket ticket(String issue, List<String> redNumbers, String blueNumber) {
        return LotteryTicket.builder()
                .issue(issue)
                .redNumbers(redNumbers)
                .blueNumber(blueNumber)
                .source("PREDICTION")
                .build();
    }

    private static LotteryTicket researchTicket(String candidateKey, String generationId) {
        return LotteryTicket.builder()
                .issue("2026079")
                .redNumbers(List.of("01", "02", "03", "04", "05", "06"))
                .blueNumber("07")
                .source("MINIGPT")
                .ticketPackId("pack-1")
                .decisionSetId("decision-1")
                .candidateKey(candidateKey)
                .generationId(generationId)
                .provenance(LotteryResearchProvenance.builder()
                        .sourceType("MINIGPT")
                        .generationId(generationId)
                        .batchId("batch-1")
                        .runId("run-1")
                        .build())
                .build();
    }
}
