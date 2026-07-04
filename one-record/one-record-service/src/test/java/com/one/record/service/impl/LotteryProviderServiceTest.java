package com.one.record.service.impl;

import com.one.record.lottery.LotteryProviderHealth;
import com.one.record.response.Record;
import com.one.record.service.LotteryDrawProvider;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LotteryProviderServiceTest {

    @Test
    void healthReturnsRegisteredDrawProviders() {
        LotteryProviderService service = new LotteryProviderService(List.of(provider("cwl"), provider("backup")));

        List<LotteryProviderHealth> health = service.health();

        assertThat(health).hasSize(2);
        assertThat(health.get(0).getProvider()).isEqualTo("backup");
        assertThat(health.get(0).getRegistered()).isTrue();
        assertThat(health.get(0).getStatus()).isEqualTo("REGISTERED");
        assertThat(health.get(1).getProvider()).isEqualTo("cwl");
        assertThat(health.get(1).getActive()).isTrue();
        assertThat(health.get(1).getCheckedAt()).isNotNull();
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
