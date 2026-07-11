package com.one.record.service.impl;

import com.one.record.configuration.RecordProperties;
import com.one.record.lottery.LotteryProviderConfig;
import com.one.record.lottery.LotteryProviderHealth;
import com.one.record.lottery.LotteryProviderProbeResult;
import com.one.record.model.LotteryProviderProbeLog;
import com.one.record.repository.LotteryProviderProbeLogRepository;
import com.one.record.response.Record;
import com.one.record.service.LotteryDrawProvider;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentCaptor.forClass;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotteryProviderServiceTest {

    @Test
    void healthReturnsRegisteredDrawProviders() {
        LotteryProviderService service = service(List.of(provider("cwl"), provider("backup")));

        List<LotteryProviderHealth> health = service.health();

        assertThat(health).hasSize(2);
        assertThat(health.get(0).getProvider()).isEqualTo("backup");
        assertThat(health.get(0).getRegistered()).isTrue();
        assertThat(health.get(0).getStatus()).isEqualTo("REGISTERED");
        assertThat(health.get(1).getProvider()).isEqualTo("cwl");
        assertThat(health.get(1).getActive()).isTrue();
        assertThat(health.get(1).getCheckedAt()).isNotNull();
    }

    @Test
    void configReturnsProviderAndSyncSnapshot() {
        RecordProperties properties = new RecordProperties();
        properties.setScheduledSyncEnabled(true);
        properties.setProviderNetworkMode("direct");
        properties.setProviderTimeoutSeconds(12);
        LotteryProviderService service = service(List.of(provider("cwl"), provider("backup")), properties, mock(LotteryProviderProbeLogRepository.class));

        LotteryProviderConfig config = service.config();

        assertThat(config.getActiveDrawProvider()).isEqualTo("cwl");
        assertThat(config.getRegisteredDrawProviders()).containsExactly("backup", "cwl");
        assertThat(config.getScheduledSyncEnabled()).isTrue();
        assertThat(config.getProviderNetworkMode()).isEqualTo("direct");
        assertThat(config.getProviderTimeoutSeconds()).isEqualTo(12);
        assertThat(config.getGeneratedAt()).isNotNull();
    }

    @Test
    void probeUsesDefaultProviderWhenProviderIsBlank() {
        LotteryProviderProbeLogRepository repository = mock(LotteryProviderProbeLogRepository.class);
        LotteryProviderService service = service(List.of(provider("cwl", 2)), new RecordProperties(), repository);

        LotteryProviderProbeResult result = service.probe(null);

        assertThat(result.getProvider()).isEqualTo("cwl");
        assertThat(result.getSuccess()).isTrue();
        assertThat(result.getStatus()).isEqualTo("AVAILABLE");
        assertThat(result.getRecordCount()).isEqualTo(2);
        assertThat(result.getDurationMs()).isNotNull();
        verify(repository).save(any(LotteryProviderProbeLog.class));
    }

    @Test
    void probeReturnsMissingWhenProviderIsNotRegistered() {
        LotteryProviderService service = service(List.of(provider("cwl")));

        LotteryProviderProbeResult result = service.probe("missing");

        assertThat(result.getSuccess()).isFalse();
        assertThat(result.getStatus()).isEqualTo("MISSING");
        assertThat(result.getRecordCount()).isEqualTo(0);
    }

    @Test
    void probeCapturesProviderFailure() {
        LotteryProviderService service = service(List.of(failingProvider("cwl")));

        LotteryProviderProbeResult result = service.probe("cwl");

        assertThat(result.getSuccess()).isFalse();
        assertThat(result.getStatus()).isEqualTo("FAILED");
        assertThat(result.getMessage()).isEqualTo("provider down");
    }

    @Test
    void probePersistsDiagnosticFields() {
        LotteryProviderProbeLogRepository repository = mock(LotteryProviderProbeLogRepository.class);
        LotteryProviderService service = service(List.of(diagnosticProvider("cwl")), new RecordProperties(), repository);

        LotteryProviderProbeResult result = service.probe("cwl");

        assertThat(result.getFailureCategory()).isEqualTo("PROXY_OR_NETWORK_BLOCK");
        assertThat(result.getRequestMode()).isEqualTo("system");
        assertThat(result.getHttpStatus()).isEqualTo(403);
        assertThat(result.getNetworkBlockSuspected()).isTrue();

        ArgumentCaptor<LotteryProviderProbeLog> captor = forClass(LotteryProviderProbeLog.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getFailureCategory()).isEqualTo("PROXY_OR_NETWORK_BLOCK");
        assertThat(captor.getValue().getHttpStatus()).isEqualTo(403);
        assertThat(captor.getValue().getResponseSnippet()).contains("forbidden");
    }

    @Test
    void probeLogsNormalizeProviderAndLimit() {
        LotteryProviderProbeLogRepository repository = mock(LotteryProviderProbeLogRepository.class);
        when(repository.findByProviderOrderByCheckedAtDesc(eq("cwl"), any(Pageable.class))).thenReturn(List.of(
                LotteryProviderProbeLog.builder().provider("cwl").status("AVAILABLE").build()
        ));
        LotteryProviderService service = service(List.of(provider("cwl")), new RecordProperties(), repository);

        List<LotteryProviderProbeLog> logs = service.probeLogs(" CWL ", 500);

        assertThat(logs).hasSize(1);
        verify(repository).findByProviderOrderByCheckedAtDesc(eq("cwl"), any(Pageable.class));
    }

    @Test
    void probeLogPageDelegatesFiltersAndZeroBasedPageToMongoRepository() {
        LotteryProviderProbeLogRepository repository = mock(LotteryProviderProbeLogRepository.class);
        when(repository.findPage(eq("cwl"), eq(false), eq(150L), eq(250L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(
                        List.of(LotteryProviderProbeLog.builder().provider("cwl").success(false).checkedAt(200L).build()),
                        PageRequest.of(1, 1),
                        3
                ));
        LotteryProviderService service = service(List.of(provider("cwl")), new RecordProperties(), repository);

        var page = service.probeLogPage(" CWL ", false, 150L, 250L, 1, 1);

        assertThat(page.getItems()).hasSize(1);
        assertThat(page.getItems().get(0).getProvider()).isEqualTo("cwl");
        assertThat(page.getItems().get(0).getSuccess()).isFalse();
        assertThat(page.getPage()).isEqualTo(1);
        assertThat(page.getTotal()).isEqualTo(3);
        assertThat(page.getHasNext()).isTrue();

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.captor();
        verify(repository).findPage(eq("cwl"), eq(false), eq(150L), eq(250L), pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageNumber()).isEqualTo(1);
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(1);
        assertThat(pageableCaptor.getValue().getSort().getOrderFor("checkedAt"))
                .extracting(Sort.Order::getDirection)
                .isEqualTo(Sort.Direction.DESC);
        assertThat(pageableCaptor.getValue().getSort().getOrderFor("_id"))
                .extracting(Sort.Order::getDirection)
                .isEqualTo(Sort.Direction.DESC);
        verify(repository, never()).findAll(any(Sort.class));
    }

    private LotteryProviderService service(List<LotteryDrawProvider> providers) {
        return service(providers, new RecordProperties(), mock(LotteryProviderProbeLogRepository.class));
    }

    private LotteryProviderService service(List<LotteryDrawProvider> providers,
                                           RecordProperties properties,
                                           LotteryProviderProbeLogRepository repository) {
        return new LotteryProviderService(providers, properties, repository);
    }

    private LotteryDrawProvider provider(String name) {
        return provider(name, 0);
    }

    private LotteryDrawProvider provider(String name, int yearlyRecordCount) {
        return new LotteryDrawProvider() {
            @Override
            public String name() {
                return name;
            }

            @Override
            public List<Record> fetchAfterDate(String lastDrawDate) {
                return List.of();
            }

            @Override
            public List<Record> fetchYearlyRecords() {
                return java.util.stream.IntStream.range(0, yearlyRecordCount)
                        .mapToObj(index -> new Record())
                        .toList();
            }
        };
    }

    private LotteryDrawProvider failingProvider(String name) {
        return new LotteryDrawProvider() {
            @Override
            public String name() {
                return name;
            }

            @Override
            public List<Record> fetchAfterDate(String lastDrawDate) {
                return List.of();
            }

            @Override
            public List<Record> fetchYearlyRecords() {
                throw new RuntimeException("provider down");
            }
        };
    }

    private LotteryDrawProvider diagnosticProvider(String name) {
        return new LotteryDrawProvider() {
            @Override
            public String name() {
                return name;
            }

            @Override
            public List<Record> fetchAfterDate(String lastDrawDate) {
                return List.of();
            }

            @Override
            public List<Record> fetchYearlyRecords() {
                return List.of();
            }

            @Override
            public LotteryProviderProbeResult probe() {
                return LotteryProviderProbeResult.builder()
                        .category("draw")
                        .provider(name)
                        .success(false)
                        .status("FAILED")
                        .message("彩票开奖接口请求失败，HTTP 403")
                        .recordCount(0)
                        .durationMs(12L)
                        .checkedAt(100L)
                        .failureCategory("PROXY_OR_NETWORK_BLOCK")
                        .requestMode("system")
                        .httpStatus(403)
                        .responseContentType("text/html")
                        .responseSnippet("forbidden")
                        .networkBlockSuspected(true)
                        .build();
            }
        };
    }
}
