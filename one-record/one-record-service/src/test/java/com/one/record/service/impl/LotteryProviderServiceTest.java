package com.one.record.service.impl;

import com.one.record.configuration.RecordProperties;
import com.one.record.lottery.LotteryProviderConfig;
import com.one.record.lottery.LotteryProviderHealth;
import com.one.record.response.Record;
import com.one.record.service.LotteryDrawProvider;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LotteryProviderServiceTest {

    @Test
    void healthReturnsRegisteredDrawProviders() {
        LotteryProviderService service = new LotteryProviderService(List.of(provider("cwl"), provider("backup")), new RecordProperties());

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
        LotteryProviderService service = new LotteryProviderService(List.of(provider("cwl"), provider("backup")), properties);

        LotteryProviderConfig config = service.config();

        assertThat(config.getActiveDrawProvider()).isEqualTo("cwl");
        assertThat(config.getRegisteredDrawProviders()).containsExactly("backup", "cwl");
        assertThat(config.getScheduledSyncEnabled()).isTrue();
        assertThat(config.getGeneratedAt()).isNotNull();
    }

    private LotteryDrawProvider provider(String name) {
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
        };
    }
}
