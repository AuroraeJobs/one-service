package com.one.record.service.impl;

import com.one.record.lottery.LotteryRecordSyncSummary;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.client.RecordClientException;
import com.one.record.model.LotteryRecordSyncLog;
import com.one.record.repository.LotteryRecordSyncLogRepository;
import com.one.record.service.ILotteryRecordSyncLogService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@AllArgsConstructor
public class LotteryRecordSyncLogService implements ILotteryRecordSyncLogService {

    private static final int DEFAULT_LIMIT = 50;

    private static final int MAX_LIMIT = 200;

    private final LotteryRecordSyncLogRepository repository;

    @Override
    public LotteryRecordSyncLog start(String jobName, String startIssue) {
        return repository.save(LotteryRecordSyncLog.builder()
                .jobName(jobName)
                .status("RUNNING")
                .startIssue(startIssue)
                .startedAt(System.currentTimeMillis())
                .message("开奖记录同步已启动")
                .build());
    }

    @Override
    public LotteryRecordSyncLog success(LotteryRecordSyncLog log, String endIssue, int savedCount, String message) {
        LotteryRecordSyncLog target = log == null ? start("manual-record-sync", null) : log;
        target.setStatus("SUCCESS");
        target.setEndIssue(endIssue);
        target.setSavedCount(savedCount);
        target.setMessage(StringUtils.hasText(message) ? message : "开奖记录同步完成");
        target.setFinishedAt(System.currentTimeMillis());
        return repository.save(target);
    }

    @Override
    public LotteryRecordSyncLog failure(LotteryRecordSyncLog log, String message) {
        LotteryRecordSyncLog target = log == null ? start("manual-record-sync", null) : log;
        target.setStatus("FAILED");
        target.setMessage(StringUtils.hasText(message) ? message : "开奖记录同步失败");
        target.setSavedCount(target.getSavedCount() == null ? 0 : target.getSavedCount());
        target.setFinishedAt(System.currentTimeMillis());
        return repository.save(target);
    }

    @Override
    public LotteryRecordSyncLog failure(LotteryRecordSyncLog log, Throwable exception) {
        String message = exception == null ? null : exception.getMessage();
        LotteryRecordSyncLog target = log == null ? start("manual-record-sync", null) : log;
        target.setStatus("FAILED");
        target.setMessage(StringUtils.hasText(message) ? message : "开奖记录同步失败");
        target.setSavedCount(target.getSavedCount() == null ? 0 : target.getSavedCount());
        applyFailureDetails(target, exception);
        target.setFinishedAt(System.currentTimeMillis());
        return repository.save(target);
    }

    @Override
    public LotteryRecordSyncLog skipped(String jobName, String startIssue, String message) {
        Long now = System.currentTimeMillis();
        return repository.save(LotteryRecordSyncLog.builder()
                .jobName(jobName)
                .status("SKIPPED")
                .startIssue(startIssue)
                .savedCount(0)
                .message(StringUtils.hasText(message) ? message : "开奖记录同步已跳过")
                .startedAt(now)
                .finishedAt(now)
                .build());
    }

    @Override
    public List<LotteryRecordSyncLog> findRecent(String status, int limit) {
        PageRequest pageRequest = PageRequest.of(0, normalizeLimit(limit));
        if (StringUtils.hasText(status)) {
            return repository.findByStatusOrderByStartedAtDesc(status.trim().toUpperCase(Locale.ROOT), pageRequest);
        }
        return repository.findByOrderByStartedAtDesc(pageRequest);
    }

    @Override
    public LotteryPageResponse<LotteryRecordSyncLog> findPage(String status,
                                                              Long startedStartAt,
                                                              Long startedEndAt,
                                                              Integer page,
                                                              Integer pageSize) {
        int safePage = normalizePage(page);
        int safePageSize = normalizePageSize(pageSize);
        String safeStatus = StringUtils.hasText(status) ? status.trim().toUpperCase(Locale.ROOT) : null;
        List<LotteryRecordSyncLog> filtered = repository.findAll(Sort.by(Sort.Direction.DESC, "startedAt"))
                .stream()
                .filter(log -> safeStatus == null || safeStatus.equals(log.getStatus()))
                .filter(log -> startedStartAt == null || log.getStartedAt() != null && log.getStartedAt() >= startedStartAt)
                .filter(log -> startedEndAt == null || log.getStartedAt() != null && log.getStartedAt() <= startedEndAt)
                .toList();
        return pageOf(filtered, safePage, safePageSize);
    }

    @Override
    public LotteryRecordSyncSummary summary(int limit) {
        List<LotteryRecordSyncLog> logs = repository.findByOrderByStartedAtDesc(PageRequest.of(0, normalizeLimit(limit)));
        LotteryRecordSyncLog latest = logs.isEmpty() ? null : logs.get(0);
        int totalCount = logs.size();
        int successCount = countStatus(logs, "SUCCESS");
        int failedCount = countStatus(logs, "FAILED");
        return LotteryRecordSyncSummary.builder()
                .totalCount(totalCount)
                .successCount(successCount)
                .failedCount(failedCount)
                .skippedCount(countStatus(logs, "SKIPPED"))
                .runningCount(countStatus(logs, "RUNNING"))
                .successRate(percent(successCount, totalCount))
                .failedRate(percent(failedCount, totalCount))
                .savedCount(sumSaved(logs))
                .latestJobName(latest == null ? null : latest.getJobName())
                .latestStatus(latest == null ? null : latest.getStatus())
                .latestMessage(latest == null ? null : latest.getMessage())
                .latestFailureCategory(latest == null ? null : latest.getFailureCategory())
                .latestProvider(latest == null ? null : latest.getProvider())
                .latestRequestMode(latest == null ? null : latest.getRequestMode())
                .latestHttpStatus(latest == null ? null : latest.getHttpStatus())
                .latestNetworkBlockSuspected(latest == null ? null : latest.getNetworkBlockSuspected())
                .latestStartIssue(latest == null ? null : latest.getStartIssue())
                .latestEndIssue(latest == null ? null : latest.getEndIssue())
                .latestStartedAt(latest == null ? null : latest.getStartedAt())
                .latestFinishedAt(latest == null ? null : latest.getFinishedAt())
                .latestDurationMs(durationMs(latest))
                .averageDurationMs(averageDurationMs(logs))
                .lastSuccessAt(lastFinishedAt(logs, "SUCCESS"))
                .lastFailureAt(lastFinishedAt(logs, "FAILED"))
                .lastSkippedAt(lastFinishedAt(logs, "SKIPPED"))
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    private static int normalizeLimit(int limit) {
        if (limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }

    private static int normalizePage(Integer page) {
        if (page == null || page < 0) {
            return 0;
        }
        return page;
    }

    private static int normalizePageSize(Integer pageSize) {
        if (pageSize == null || pageSize <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(pageSize, MAX_LIMIT);
    }

    private static LotteryPageResponse<LotteryRecordSyncLog> pageOf(List<LotteryRecordSyncLog> items, int page, int pageSize) {
        int total = items == null ? 0 : items.size();
        int from = Math.min(page * pageSize, total);
        int to = Math.min(from + pageSize, total);
        return LotteryPageResponse.<LotteryRecordSyncLog>builder()
                .items(items == null ? List.of() : items.subList(from, to))
                .page(page)
                .pageSize(pageSize)
                .total((long) total)
                .hasNext(to < total)
                .build();
    }

    private static int countStatus(List<LotteryRecordSyncLog> logs, String status) {
        return (int) logs.stream()
                .filter(log -> status.equals(log.getStatus()))
                .count();
    }

    private static BigDecimal percent(int count, int total) {
        if (total <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(count)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }

    private static int sumSaved(List<LotteryRecordSyncLog> logs) {
        return logs.stream()
                .map(LotteryRecordSyncLog::getSavedCount)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();
    }

    private static Long durationMs(LotteryRecordSyncLog log) {
        if (log == null || log.getStartedAt() == null || log.getFinishedAt() == null) {
            return null;
        }
        return Math.max(0L, log.getFinishedAt() - log.getStartedAt());
    }

    private static Long averageDurationMs(List<LotteryRecordSyncLog> logs) {
        List<Long> durations = logs.stream()
                .map(LotteryRecordSyncLogService::durationMs)
                .filter(Objects::nonNull)
                .toList();
        if (durations.isEmpty()) {
            return null;
        }
        long total = durations.stream().mapToLong(Long::longValue).sum();
        return total / durations.size();
    }

    private static Long lastFinishedAt(List<LotteryRecordSyncLog> logs, String status) {
        return logs.stream()
                .filter(log -> status.equals(log.getStatus()))
                .map(LotteryRecordSyncLog::getFinishedAt)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    private static void applyFailureDetails(LotteryRecordSyncLog target, Throwable exception) {
        if (exception instanceof RecordClientException recordClientException) {
            target.setFailureCategory(recordClientException.getFailureCategory());
            target.setProvider(recordClientException.getProvider());
            target.setRequestMode(recordClientException.getNetworkMode());
            target.setHttpStatus(recordClientException.getHttpStatus());
            target.setNetworkBlockSuspected(recordClientException.getNetworkBlockSuspected());
            return;
        }
        String message = exception == null ? null : exception.getMessage();
        if (StringUtils.hasText(message) && message.contains("HTTP 403")) {
            target.setFailureCategory("PROXY_OR_NETWORK_BLOCK");
            target.setHttpStatus(403);
            target.setNetworkBlockSuspected(true);
        }
    }
}
