package com.one.record.service.impl;

import com.one.record.model.LotteryPreference;
import com.one.record.repository.LotteryPreferenceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;
import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LotteryPreferenceServiceTest {

    private LotteryPreferenceRepository repository;

    private LotteryPreferenceService service;

    @BeforeEach
    void setUp() {
        repository = mock(LotteryPreferenceRepository.class);
        service = new LotteryPreferenceService(repository);
    }

    @Test
    void preferenceReturnsDefaultsWhenMissing() {
        when(repository.findByUserId("default")).thenReturn(Optional.empty());

        LotteryPreference preference = service.preference();

        assertThat(preference.getUserId()).isEqualTo("default");
        assertThat(preference.getDefaultTrainingScale()).isEqualTo("standard");
        assertThat(preference.getDefaultReplayCount()).isEqualTo(0);
        assertThat(preference.getAutoSavePredictions()).isFalse();
        assertThat(preference.getDefaultTicketSource()).isEqualTo("MANUAL");
        assertThat(preference.getBudgetReminderPercent()).isEqualTo(80);
        assertThat(preference.getCreatedAt()).isNotNull();
    }

    @Test
    void updatePreferenceNormalizesAndPersistsDefaults() {
        ArgumentCaptor<LotteryPreference> captor = ArgumentCaptor.forClass(LotteryPreference.class);
        when(repository.findByUserId("default")).thenReturn(Optional.empty());
        when(repository.save(captor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        LotteryPreference saved = service.updatePreference(LotteryPreference.builder()
                .defaultTrainingScale(" Deep ")
                .defaultReplayCount(-1)
                .autoSavePredictions(true)
                .defaultTicketSource(" prediction ")
                .weeklyBudget(new BigDecimal("19.995"))
                .monthlyBudget(BigDecimal.ZERO)
                .maxTicketsPerIssue(0)
                .budgetReminderPercent(120)
                .build());

        assertThat(saved).isSameAs(captor.getValue());
        assertThat(saved.getUserId()).isEqualTo("default");
        assertThat(saved.getDefaultTrainingScale()).isEqualTo("deep");
        assertThat(saved.getDefaultReplayCount()).isEqualTo(0);
        assertThat(saved.getAutoSavePredictions()).isTrue();
        assertThat(saved.getDefaultTicketSource()).isEqualTo("PREDICTION");
        assertThat(saved.getWeeklyBudget()).isEqualByComparingTo("20.00");
        assertThat(saved.getMonthlyBudget()).isNull();
        assertThat(saved.getMaxTicketsPerIssue()).isNull();
        assertThat(saved.getBudgetReminderPercent()).isEqualTo(100);
        assertThat(saved.getUpdatedAt()).isNotNull();
    }
}
