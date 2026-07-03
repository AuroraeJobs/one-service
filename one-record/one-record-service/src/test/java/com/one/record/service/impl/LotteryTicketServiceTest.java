package com.one.record.service.impl;

import com.one.common.exception.NotFoundException;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryTicketRepository;
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

    private LotteryTicketService service;

    @BeforeEach
    void setUp() {
        repository = mock(LotteryTicketRepository.class);
        service = new LotteryTicketService(repository);
    }

    @Test
    void ticketsFiltersByIssueWhenProvided() {
        when(repository.findByUserIdAndIssueOrderByCreatedAtDesc("default", "2026001")).thenReturn(List.of());

        service.tickets(" 2026001 ");

        verify(repository).findByUserIdAndIssueOrderByCreatedAtDesc("default", "2026001");
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
}
