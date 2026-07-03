package com.one.record.service.impl;

import com.one.common.exception.ServiceException;
import com.one.record.configuration.StockMarketProperties;
import com.one.record.repository.StockKLineRepository;
import com.one.record.repository.StockKLineSyncLogRepository;
import com.one.record.service.IStockKLineService;
import com.one.record.service.IStockMarketService;
import com.one.record.stock.StockKLine;
import com.one.record.stock.StockKLineSyncLog;
import com.one.record.stock.StockKLineSyncSummary;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class StockKLineService implements IStockKLineService {

    private static final String DEFAULT_PERIOD = "daily";

    private static final String MIN_DATE = "0000-00-00";

    private static final String MAX_DATE = "9999-99-99";

    private static final Duration SYNC_LOCK_TTL = Duration.ofMinutes(10);

    private static final int DEFAULT_SYNC_LOG_LIMIT = 50;

    private static final int MAX_SYNC_LOG_LIMIT = 100;

    private final StockKLineRepository repository;

    private final StockKLineSyncLogRepository syncLogRepository;

    private final IStockMarketService stockMarketService;

    private final StringRedisTemplate redisTemplate;

    private final StockMarketProperties properties;

    private final StockKLineProviderRouter providerRouter;

    @Override
    public List<StockKLine> find(String symbol, String period, String startDate, String endDate) {
        String normalizedSymbol = normalizeSymbol(symbol);
        String normalizedPeriod = normalizePeriod(period);
        String safeStartDate = StringUtils.hasText(startDate) ? startDate.trim() : MIN_DATE;
        String safeEndDate = StringUtils.hasText(endDate) ? endDate.trim() : MAX_DATE;
        return repository.findBySymbolAndPeriodAndTradeDateBetweenOrderByTradeDateAsc(
                normalizedSymbol, normalizedPeriod, safeStartDate, safeEndDate);
    }

    @Override
    public StockKLine save(String symbol, StockKLine kLine) {
        if (kLine == null) {
            throw new ServiceException("K线数据不能为空");
        }
        return saveNormalized(normalizeSymbol(valueOrDefault(symbol, kLine.getSymbol())), kLine);
    }

    @Override
    public List<StockKLine> sync(String symbol, List<StockKLine> kLines) {
        String normalizedSymbol = normalizeSymbol(symbol);
        boolean providerSync = kLines == null || kLines.isEmpty();
        return runWithSyncLog(syncLockKey(normalizedSymbol), "stock-kline-sync", normalizedSymbol, kLines,
                () -> {
                    List<StockKLine> source = providerSync
                            ? providerRouter.dailyKLines(normalizedSymbol, null, null)
                            : kLines;
                    return saveKLines(normalizedSymbol, source);
                });
    }

    @Override
    public List<StockKLine> syncAll(List<StockKLine> kLines) {
        boolean providerSync = kLines == null || kLines.isEmpty();
        return runWithSyncLog(syncLockKey("all"), "stock-kline-sync-all", null, kLines,
                () -> {
                    if (!providerSync) {
                        return saveKLines(null, kLines);
                    }
                    List<StockKLine> fetched = new ArrayList<>();
                    for (String symbol : configuredSyncSymbols()) {
                        fetched.addAll(providerRouter.dailyKLines(normalizeSymbol(symbol), null, null));
                    }
                    return saveKLines(null, fetched);
                });
    }

    @Override
    public List<StockKLine> retryConfiguredSync() {
        return runWithSyncLog(syncLockKey("retry-all"), "stock-kline-sync-retry-all", null, null,
                () -> {
                    List<StockKLine> fetched = new ArrayList<>();
                    for (String symbol : configuredSyncSymbols()) {
                        fetched.addAll(providerRouter.dailyKLines(normalizeSymbol(symbol), null, null));
                    }
                    return saveKLines(null, fetched);
                });
    }

    @Override
    public StockKLineSyncLog scheduledDailySync() {
        String lockKey = syncLockKey("scheduled-daily");
        if (!acquireLock(lockKey)) {
            throw new ServiceException("K线定时同步任务正在执行，请稍后重试");
        }

        List<String> symbols = configuredSyncSymbols();
        StockKLineSyncLog syncLog = StockKLineSyncLog.builder()
                .jobName("stock-kline-scheduled-daily")
                .period(DEFAULT_PERIOD)
                .status("RUNNING")
                .requestedCount(symbols.size())
                .savedCount(0)
                .startedAt(System.currentTimeMillis())
                .build();
        syncLog = syncLogRepository.save(syncLog);
        try {
            List<StockKLine> fetched = new ArrayList<>();
            for (String symbol : symbols) {
                fetched.addAll(providerRouter.dailyKLines(normalizeSymbol(symbol), null, null));
            }
            List<StockKLine> saved = saveKLines(null, fetched);
            syncLog.setStatus("SUCCESS");
            syncLog.setSavedCount(saved.size());
            syncLog.setMessage("OK");
            return syncLog;
        } catch (RuntimeException ex) {
            syncLog.setStatus("FAILED");
            syncLog.setMessage(ex.getMessage());
            throw ex;
        } finally {
            syncLog.setFinishedAt(System.currentTimeMillis());
            syncLogRepository.save(syncLog);
            releaseLock(lockKey);
        }
    }

    @Override
    public List<StockKLineSyncLog> syncLogs(String symbol, String status, Integer limit) {
        String normalizedSymbol = StringUtils.hasText(symbol) ? stockMarketService.normalizeSymbol(symbol) : null;
        String normalizedStatus = normalizeStatus(status);
        PageRequest pageRequest = PageRequest.of(0, normalizeSyncLogLimit(limit));
        if (StringUtils.hasText(normalizedSymbol) && StringUtils.hasText(normalizedStatus)) {
            return syncLogRepository.findBySymbolAndStatusOrderByStartedAtDesc(normalizedSymbol, normalizedStatus, pageRequest);
        }
        if (StringUtils.hasText(normalizedSymbol)) {
            return syncLogRepository.findBySymbolOrderByStartedAtDesc(normalizedSymbol, pageRequest);
        }
        if (StringUtils.hasText(normalizedStatus)) {
            return syncLogRepository.findByStatusOrderByStartedAtDesc(normalizedStatus, pageRequest);
        }
        return syncLogRepository.findByOrderByStartedAtDesc(pageRequest);
    }

    @Override
    public StockKLineSyncSummary syncSummary(String symbol, Integer limit) {
        String normalizedSymbol = StringUtils.hasText(symbol) ? stockMarketService.normalizeSymbol(symbol) : null;
        int normalizedLimit = normalizeSyncLogLimit(limit);
        List<StockKLineSyncLog> logs = StringUtils.hasText(normalizedSymbol)
                ? syncLogRepository.findBySymbolOrderByStartedAtDesc(normalizedSymbol, PageRequest.of(0, normalizedLimit))
                : syncLogRepository.findByOrderByStartedAtDesc(PageRequest.of(0, normalizedLimit));
        StockKLineSyncLog latest = logs.isEmpty() ? null : logs.get(0);
        int totalCount = logs.size();
        int successCount = countStatus(logs, "SUCCESS");
        int failedCount = countStatus(logs, "FAILED");
        return StockKLineSyncSummary.builder()
                .symbol(normalizedSymbol)
                .totalCount(totalCount)
                .successCount(successCount)
                .failedCount(failedCount)
                .runningCount(countStatus(logs, "RUNNING"))
                .successRate(percent(successCount, totalCount))
                .failedRate(percent(failedCount, totalCount))
                .requestedCount(sumRequested(logs))
                .savedCount(sumSaved(logs))
                .latestJobName(latest == null ? null : latest.getJobName())
                .latestStatus(latest == null ? null : latest.getStatus())
                .latestMessage(latest == null ? null : latest.getMessage())
                .latestStartedAt(latest == null ? null : latest.getStartedAt())
                .latestFinishedAt(latest == null ? null : latest.getFinishedAt())
                .latestDurationMs(durationMs(latest))
                .averageDurationMs(averageDurationMs(logs))
                .lastSuccessAt(lastFinishedAt(logs, "SUCCESS"))
                .lastFailureAt(lastFinishedAt(logs, "FAILED"))
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    private int normalizeSyncLogLimit(Integer limit) {
        if (limit == null || limit <= 0) {
            return DEFAULT_SYNC_LOG_LIMIT;
        }
        return Math.min(limit, MAX_SYNC_LOG_LIMIT);
    }

    private String normalizeStatus(String status) {
        return StringUtils.hasText(status) ? status.trim().toUpperCase() : null;
    }

    private int countStatus(List<StockKLineSyncLog> logs, String status) {
        return (int) logs.stream()
                .filter(log -> status.equals(log.getStatus()))
                .count();
    }

    private BigDecimal percent(int count, int total) {
        if (total <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(count)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }

    private Long durationMs(StockKLineSyncLog log) {
        if (log == null || log.getStartedAt() == null || log.getFinishedAt() == null) {
            return null;
        }
        long duration = log.getFinishedAt() - log.getStartedAt();
        return duration >= 0 ? duration : null;
    }

    private Long averageDurationMs(List<StockKLineSyncLog> logs) {
        List<Long> durations = logs.stream()
                .map(this::durationMs)
                .filter(duration -> duration != null)
                .toList();
        if (durations.isEmpty()) {
            return null;
        }
        return Math.round(durations.stream()
                .mapToLong(Long::longValue)
                .average()
                .orElse(0));
    }

    private int sumRequested(List<StockKLineSyncLog> logs) {
        return logs.stream()
                .map(StockKLineSyncLog::getRequestedCount)
                .filter(count -> count != null)
                .mapToInt(Integer::intValue)
                .sum();
    }

    private int sumSaved(List<StockKLineSyncLog> logs) {
        return logs.stream()
                .map(StockKLineSyncLog::getSavedCount)
                .filter(count -> count != null)
                .mapToInt(Integer::intValue)
                .sum();
    }

    private Long lastFinishedAt(List<StockKLineSyncLog> logs, String status) {
        return logs.stream()
                .filter(log -> status.equals(log.getStatus()))
                .map(log -> log.getFinishedAt() == null ? log.getStartedAt() : log.getFinishedAt())
                .filter(time -> time != null)
                .findFirst()
                .orElse(null);
    }

    private List<StockKLine> saveKLines(String fixedSymbol, List<StockKLine> kLines) {
        if (kLines == null || kLines.isEmpty()) {
            return List.of();
        }

        List<StockKLine> saved = new ArrayList<>();
        for (StockKLine kLine : kLines) {
            String symbol = fixedSymbol == null ? normalizeSymbol(kLine == null ? null : kLine.getSymbol()) : fixedSymbol;
            saved.add(saveNormalized(symbol, kLine));
        }
        return saved;
    }

    private StockKLine saveNormalized(String symbol, StockKLine kLine) {
        if (kLine == null) {
            throw new ServiceException("K线数据不能为空");
        }
        if (!StringUtils.hasText(kLine.getTradeDate())) {
            throw new ServiceException("K线交易日期不能为空");
        }

        String period = normalizePeriod(kLine.getPeriod());
        StockKLine target = repository.findBySymbolAndPeriodAndTradeDate(symbol, period, kLine.getTradeDate().trim())
                .orElseGet(() -> {
                    StockKLine created = new StockKLine();
                    created.setCreatedAt(System.currentTimeMillis());
                    return created;
                });

        target.setSymbol(symbol);
        target.setMarket(market(symbol));
        target.setCode(code(symbol));
        target.setPeriod(period);
        target.setTradeDate(kLine.getTradeDate().trim());
        target.setOpen(kLine.getOpen());
        target.setClose(kLine.getClose());
        target.setHigh(kLine.getHigh());
        target.setLow(kLine.getLow());
        target.setVolume(kLine.getVolume());
        target.setAmount(kLine.getAmount());
        target.setChangeAmount(kLine.getChangeAmount());
        target.setChangePercent(kLine.getChangePercent());
        target.setSource(kLine.getSource());
        target.setUpdatedAt(System.currentTimeMillis());
        return repository.save(target);
    }

    private String normalizeSymbol(String symbol) {
        String normalizedSymbol = stockMarketService.normalizeSymbol(symbol);
        if (!StringUtils.hasText(normalizedSymbol)) {
            throw new ServiceException("股票代码不能为空");
        }
        return normalizedSymbol;
    }

    private String normalizePeriod(String period) {
        return StringUtils.hasText(period) ? period.trim().toLowerCase() : DEFAULT_PERIOD;
    }

    private List<StockKLine> runWithSyncLog(String lockKey,
                                            String jobName,
                                            String symbol,
                                            List<StockKLine> kLines,
                                            SyncAction action) {
        if (!acquireLock(lockKey)) {
            throw new ServiceException("K线同步任务正在执行，请稍后重试");
        }

        StockKLineSyncLog syncLog = StockKLineSyncLog.builder()
                .jobName(jobName)
                .symbol(symbol)
                .period(resolveLogPeriod(kLines))
                .status("RUNNING")
                .requestedCount(kLines == null ? 0 : kLines.size())
                .savedCount(0)
                .startedAt(System.currentTimeMillis())
                .build();
        syncLog = syncLogRepository.save(syncLog);
        try {
            List<StockKLine> saved = action.run();
            syncLog.setStatus("SUCCESS");
            syncLog.setSavedCount(saved.size());
            syncLog.setMessage("OK");
            return saved;
        } catch (RuntimeException ex) {
            syncLog.setStatus("FAILED");
            syncLog.setMessage(ex.getMessage());
            throw ex;
        } finally {
            syncLog.setFinishedAt(System.currentTimeMillis());
            syncLogRepository.save(syncLog);
            releaseLock(lockKey);
        }
    }

    private boolean acquireLock(String lockKey) {
        try {
            Boolean locked = redisTemplate.opsForValue().setIfAbsent(lockKey, String.valueOf(System.currentTimeMillis()), SYNC_LOCK_TTL);
            return Boolean.TRUE.equals(locked);
        } catch (RuntimeException ex) {
            throw new ServiceException("K线同步锁获取失败: " + ex.getMessage());
        }
    }

    private void releaseLock(String lockKey) {
        try {
            redisTemplate.delete(lockKey);
        } catch (RuntimeException ignored) {
            // Lock will expire by TTL if Redis delete fails.
        }
    }

    private String syncLockKey(String symbol) {
        return "stock:sync:lock:kline:" + symbol;
    }

    private String resolveLogPeriod(List<StockKLine> kLines) {
        if (kLines == null || kLines.isEmpty() || kLines.get(0) == null) {
            return DEFAULT_PERIOD;
        }
        return normalizePeriod(kLines.get(0).getPeriod());
    }

    private List<String> configuredSyncSymbols() {
        if (properties.getKlineSyncSymbols() == null || properties.getKlineSyncSymbols().isEmpty()) {
            return List.of();
        }
        return properties.getKlineSyncSymbols().stream()
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }

    private String valueOrDefault(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }

    private String market(String symbol) {
        return symbol.length() > 2 ? symbol.substring(0, 2) : "";
    }

    private String code(String symbol) {
        return symbol.length() > 2 ? symbol.substring(2) : symbol;
    }

    private interface SyncAction {

        List<StockKLine> run();
    }
}
