package com.one.record.service.impl;

import com.one.common.exception.NotFoundException;
import com.one.record.lottery.LotteryPrizeResult;
import com.one.record.lottery.LotteryTicketBatchSaveRequest;
import com.one.record.lottery.LotteryTicketBatchSaveResult;
import com.one.record.lottery.LotteryTicketPrizeCheckSummary;
import com.one.record.lottery.LotteryTicketSummary;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.response.Record;
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

    private LotteryTicketService service;

    @BeforeEach
    void setUp() {
        repository = mock(LotteryTicketRepository.class);
        recordService = mock(IRecordService.class);
        service = new LotteryTicketService(repository, recordService);
    }

    @Test
    void ticketsFiltersByIssueWhenProvided() {
        when(repository.findByUserIdAndIssueOrderByCreatedAtDesc("default", "2026001")).thenReturn(List.of());

        service.tickets(" 2026001 ", null, null, null);

        verify(repository).findByUserIdAndIssueOrderByCreatedAtDesc("default", "2026001");
    }

    @Test
    void ticketsFiltersByStatusSourceAndPrizeGrade() {
        when(repository.findByUserIdOrderByPeriodDescCreatedAtDesc("default")).thenReturn(List.of(
                LotteryTicket.builder().id("a").status("CHECKED").source("PREDICTION").prizeGrade("FIFTH").build(),
                LotteryTicket.builder().id("b").status("DRAFT").source("MANUAL").prizeGrade("NONE").build()
        ));

        List<LotteryTicket> tickets = service.tickets(null, "checked", "prediction", "fifth");

        assertThat(tickets).extracting(LotteryTicket::getId).containsExactly("a");
    }

    @Test
    void ticketsAppliesSecondaryFiltersAfterIssueQuery() {
        when(repository.findByUserIdAndIssueOrderByCreatedAtDesc("default", "2026001")).thenReturn(List.of(
                LotteryTicket.builder().id("a").status("CHECKED").source("PREDICTION").prizeGrade("FIFTH").build(),
                LotteryTicket.builder().id("b").status("CHECKED").source("MANUAL").prizeGrade("FIFTH").build()
        ));

        List<LotteryTicket> tickets = service.tickets("2026001", "checked", "prediction", "fifth");

        assertThat(tickets).extracting(LotteryTicket::getId).containsExactly("a");
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
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
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
    }

    @Test
    void updateTicketPreservesExistingIdentityAndCreatedAt() {
        when(repository.findByIdAndUserId("ticket-1", "default")).thenReturn(Optional.of(LotteryTicket.builder()
                .id("ticket-1")
                .userId("default")
                .createdAt(100L)
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
}
