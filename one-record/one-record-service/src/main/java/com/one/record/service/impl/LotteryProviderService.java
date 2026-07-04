package com.one.record.service.impl;

import com.one.record.configuration.RecordProperties;
import com.one.record.lottery.LotteryProviderConfig;
import com.one.record.lottery.LotteryProviderHealth;
import com.one.record.service.ILotteryProviderService;
import com.one.record.service.LotteryDrawProvider;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@AllArgsConstructor
public class LotteryProviderService implements ILotteryProviderService {

    private static final String ACTIVE_DRAW_PROVIDER = "cwl";

    private final List<LotteryDrawProvider> drawProviders;

    private final RecordProperties recordProperties;

    @Override
    public List<LotteryProviderHealth> health() {
        Long checkedAt = System.currentTimeMillis();
        return drawProviders.stream()
                .map(provider -> normalizeProviderName(provider.name()))
                .distinct()
                .sorted(Comparator.naturalOrder())
                .map(providerName -> LotteryProviderHealth.builder()
                        .category("draw")
                        .provider(providerName)
                        .active(ACTIVE_DRAW_PROVIDER.equals(providerName))
                        .registered(true)
                        .status("REGISTERED")
                        .checkedAt(checkedAt)
                        .build())
                .toList();
    }

    @Override
    public LotteryProviderConfig config() {
        return LotteryProviderConfig.builder()
                .activeDrawProvider(ACTIVE_DRAW_PROVIDER)
                .registeredDrawProviders(registeredDrawProviders())
                .scheduledSyncEnabled(recordProperties.isScheduledSyncEnabled())
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    private List<String> registeredDrawProviders() {
        return drawProviders.stream()
                .map(provider -> normalizeProviderName(provider.name()))
                .distinct()
                .sorted(Comparator.naturalOrder())
                .toList();
    }

    private String normalizeProviderName(String providerName) {
        return providerName == null ? "" : providerName.trim().toLowerCase(Locale.ROOT);
    }
}
