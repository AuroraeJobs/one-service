package com.one.record.service.impl;

import com.one.common.exception.ServiceException;
import com.one.record.repository.StockPreferenceRepository;
import com.one.record.stock.StockPreference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StockPreferenceServiceTest {

    private StockPreferenceRepository repository;

    private StockPreferenceService service;

    @BeforeEach
    void setUp() {
        repository = mock(StockPreferenceRepository.class);
        service = new StockPreferenceService(repository);
    }

    @Test
    void getReturnsDefaultsWhenPreferenceDoesNotExist() {
        when(repository.findByUserId("default")).thenReturn(Optional.empty());

        StockPreference preference = service.get();

        assertThat(preference.getUserId()).isEqualTo("default");
        assertThat(preference.getDefaultCurrency()).isEqualTo("CNY");
        assertThat(preference.getDefaultKLinePeriod()).isEqualTo("daily");
        assertThat(preference.getQuoteRefreshIntervalSeconds()).isEqualTo(30);
        assertThat(preference.getCreatedAt()).isNotNull();
        assertThat(preference.getUpdatedAt()).isNotNull();
    }

    @Test
    void saveNormalizesAndPreservesCreatedAt() {
        when(repository.findByUserId("default")).thenReturn(Optional.of(StockPreference.builder()
                .id("pref1")
                .userId("default")
                .createdAt(1000L)
                .build()));
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        StockPreference saved = service.save(StockPreference.builder()
                .defaultAccountId(" acc1 ")
                .defaultCurrency(" cny ")
                .defaultKLinePeriod("WEEKLY")
                .quoteRefreshIntervalSeconds(60)
                .build());

        assertThat(saved.getId()).isEqualTo("pref1");
        assertThat(saved.getUserId()).isEqualTo("default");
        assertThat(saved.getDefaultAccountId()).isEqualTo("acc1");
        assertThat(saved.getDefaultCurrency()).isEqualTo("CNY");
        assertThat(saved.getDefaultKLinePeriod()).isEqualTo("weekly");
        assertThat(saved.getQuoteRefreshIntervalSeconds()).isEqualTo(60);
        assertThat(saved.getCreatedAt()).isEqualTo(1000L);
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void saveRejectsUnsupportedKLinePeriod() {
        when(repository.findByUserId("default")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.save(StockPreference.builder()
                .defaultKLinePeriod("hourly")
                .build()))
                .isInstanceOf(ServiceException.class)
                .hasMessageContaining("不支持的默认K线周期");
    }

    @Test
    void saveRejectsInvalidRefreshInterval() {
        when(repository.findByUserId("default")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.save(StockPreference.builder()
                .quoteRefreshIntervalSeconds(2)
                .build()))
                .isInstanceOf(ServiceException.class)
                .hasMessageContaining("行情刷新间隔");
    }
}
