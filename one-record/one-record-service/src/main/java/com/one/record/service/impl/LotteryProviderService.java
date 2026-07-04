package com.one.record.service.impl;

import com.one.record.configuration.RecordProperties;
import com.one.record.lottery.LotteryProviderConfig;
import com.one.record.lottery.LotteryProviderHealth;
import com.one.record.lottery.LotteryProviderProbeResult;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryProviderProbeLog;
import com.one.record.repository.LotteryProviderProbeLogRepository;
import com.one.record.response.Record;
import com.one.record.service.ILotteryProviderService;
import com.one.record.service.LotteryDrawProvider;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class LotteryProviderService implements ILotteryProviderService {

    private static final String ACTIVE_DRAW_PROVIDER = "cwl";

    private static final int DEFAULT_PROBE_LOG_LIMIT = 20;

    private static final int MAX_PROBE_LOG_LIMIT = 200;

    private final List<LotteryDrawProvider> drawProviders;

    private final RecordProperties recordProperties;

    private final LotteryProviderProbeLogRepository probeLogRepository;

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
            return saveProbeResult(LotteryProviderProbeResult.builder()
                    .category("draw")
                    .provider(providerName)
                    .success(false)
                    .status("MISSING")
                    .message("彩票开奖 provider 未注册")
                    .recordCount(0)
                    .durationMs(0L)
                    .checkedAt(checkedAt)
                    .build());
        }
        long startedAt = System.currentTimeMillis();
        try {
            List<Record> records = drawProvider.fetchYearlyRecords();
            return saveProbeResult(LotteryProviderProbeResult.builder()
                    .category("draw")
                    .provider(providerName)
                    .success(true)
                    .status("AVAILABLE")
                    .message("provider 探测成功")
                    .recordCount(records == null ? 0 : records.size())
                    .durationMs(System.currentTimeMillis() - startedAt)
                    .checkedAt(checkedAt)
                    .build());
        } catch (RuntimeException exception) {
            return saveProbeResult(LotteryProviderProbeResult.builder()
                    .category("draw")
                    .provider(providerName)
                    .success(false)
                    .status("FAILED")
                    .message(exception.getMessage())
                    .recordCount(0)
                    .durationMs(System.currentTimeMillis() - startedAt)
                    .checkedAt(checkedAt)
                    .build());
        }
    }

    @Override
    public List<LotteryProviderProbeLog> probeLogs(String provider, int limit) {
        PageRequest pageRequest = PageRequest.of(0, normalizeLimit(limit));
        if (StringUtils.hasText(provider)) {
            return probeLogRepository.findByProviderOrderByCheckedAtDesc(normalizeProviderName(provider), pageRequest);
        }
        return probeLogRepository.findByOrderByCheckedAtDesc(pageRequest);
    }

    @Override
    public LotteryPageResponse<LotteryProviderProbeLog> probeLogPage(String provider,
                                                                     Boolean success,
                                                                     Long checkedStartAt,
                                                                     Long checkedEndAt,
                                                                     Integer page,
                                                                     Integer pageSize) {
        int safePage = normalizePage(page);
        int safePageSize = normalizePageSize(pageSize);
        String safeProvider = StringUtils.hasText(provider) ? normalizeProviderName(provider) : null;
        List<LotteryProviderProbeLog> filtered = probeLogRepository.findAll(Sort.by(Sort.Direction.DESC, "checkedAt"))
                .stream()
                .filter(log -> safeProvider == null || safeProvider.equals(normalizeProviderName(log.getProvider())))
                .filter(log -> success == null || success.equals(log.getSuccess()))
                .filter(log -> checkedStartAt == null || log.getCheckedAt() != null && log.getCheckedAt() >= checkedStartAt)
                .filter(log -> checkedEndAt == null || log.getCheckedAt() != null && log.getCheckedAt() <= checkedEndAt)
                .toList();
        return pageOf(filtered, safePage, safePageSize);
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

    private LotteryProviderProbeResult saveProbeResult(LotteryProviderProbeResult result) {
        try {
            probeLogRepository.save(LotteryProviderProbeLog.builder()
                    .category(result.getCategory())
                    .provider(result.getProvider())
                    .success(result.getSuccess())
                    .status(result.getStatus())
                    .message(result.getMessage())
                    .recordCount(result.getRecordCount())
                    .durationMs(result.getDurationMs())
                    .checkedAt(result.getCheckedAt())
                    .build());
        } catch (RuntimeException exception) {
            log.warn("Failed to save lottery provider probe log, provider={}", result.getProvider(), exception);
        }
        return result;
    }

    private static int normalizeLimit(int limit) {
        if (limit <= 0) {
            return DEFAULT_PROBE_LOG_LIMIT;
        }
        return Math.min(limit, MAX_PROBE_LOG_LIMIT);
    }

    private static int normalizePage(Integer page) {
        if (page == null || page < 0) {
            return 0;
        }
        return page;
    }

    private static int normalizePageSize(Integer pageSize) {
        if (pageSize == null || pageSize <= 0) {
            return DEFAULT_PROBE_LOG_LIMIT;
        }
        return Math.min(pageSize, MAX_PROBE_LOG_LIMIT);
    }

    private static LotteryPageResponse<LotteryProviderProbeLog> pageOf(List<LotteryProviderProbeLog> items,
                                                                       int page,
                                                                       int pageSize) {
        int total = items == null ? 0 : items.size();
        int from = Math.min(page * pageSize, total);
        int to = Math.min(from + pageSize, total);
        return LotteryPageResponse.<LotteryProviderProbeLog>builder()
                .items(items == null ? List.of() : items.subList(from, to))
                .page(page)
                .pageSize(pageSize)
                .total((long) total)
                .hasNext(to < total)
                .build();
    }
}
