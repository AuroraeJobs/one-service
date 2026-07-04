package com.one.record.service.impl;

import com.one.record.configuration.RecordProperties;
import com.one.record.lottery.LotteryProviderConfig;
import com.one.record.lottery.LotteryProviderHealth;
import com.one.record.lottery.LotteryProviderProbeResult;
import com.one.record.response.Record;
import com.one.record.service.ILotteryProviderService;
import com.one.record.service.LotteryDrawProvider;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

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

    @Override
    public LotteryProviderProbeResult probe(String provider) {
        String providerName = normalizeProviderName(provider == null || provider.isBlank() ? ACTIVE_DRAW_PROVIDER : provider);
        Map<String, LotteryDrawProvider> providerMap = drawProviderMap();
        LotteryDrawProvider drawProvider = providerMap.get(providerName);
        Long checkedAt = System.currentTimeMillis();
        if (drawProvider == null) {
            return LotteryProviderProbeResult.builder()
                    .category("draw")
                    .provider(providerName)
                    .success(false)
                    .status("MISSING")
                    .message("彩票开奖 provider 未注册")
                    .recordCount(0)
                    .durationMs(0L)
                    .checkedAt(checkedAt)
                    .build();
        }
        long startedAt = System.currentTimeMillis();
        try {
            List<Record> records = drawProvider.fetchYearlyRecords();
            return LotteryProviderProbeResult.builder()
                    .category("draw")
                    .provider(providerName)
                    .success(true)
                    .status("AVAILABLE")
                    .message("provider 探测成功")
                    .recordCount(records == null ? 0 : records.size())
                    .durationMs(System.currentTimeMillis() - startedAt)
                    .checkedAt(checkedAt)
                    .build();
        } catch (RuntimeException exception) {
            return LotteryProviderProbeResult.builder()
                    .category("draw")
                    .provider(providerName)
                    .success(false)
                    .status("FAILED")
                    .message(exception.getMessage())
                    .recordCount(0)
                    .durationMs(System.currentTimeMillis() - startedAt)
                    .checkedAt(checkedAt)
                    .build();
        }
    }

    private List<String> registeredDrawProviders() {
        return drawProviders.stream()
                .map(provider -> normalizeProviderName(provider.name()))
                .distinct()
                .sorted(Comparator.naturalOrder())
                .toList();
    }

    private Map<String, LotteryDrawProvider> drawProviderMap() {
        return drawProviders.stream()
                .collect(Collectors.toMap(provider -> normalizeProviderName(provider.name()), Function.identity(), (left, right) -> left));
    }

    private String normalizeProviderName(String providerName) {
        return providerName == null ? "" : providerName.trim().toLowerCase(Locale.ROOT);
    }
}
