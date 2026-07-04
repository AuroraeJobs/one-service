package com.one.record.service.impl;

import com.one.record.lottery.LotteryDataQualityReport;
import com.one.record.lottery.LotteryDataQualityRepairRequest;
import com.one.record.lottery.LotteryDataQualityRepairResult;
import com.one.record.lottery.LotteryStatisticsSummary;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.response.Record;
import com.one.record.service.ILotteryDataQualityService;
import com.one.record.service.ILotteryStatisticsService;
import com.one.record.service.IRecordService;
import com.one.record.service.LotteryDrawProvider;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class LotteryDataQualityService implements ILotteryDataQualityService {

    private static final int SAMPLE_LIMIT = 50;

    private static final int DEFAULT_REPAIR_LIMIT = 50;

    private static final int MAX_REPAIR_LIMIT = 200;

    private final IRecordService recordService;

    private final LotteryDrawProvider lotteryDrawProvider;

    private final ILotteryStatisticsService statisticsService;

    private final LotteryAuditEventRepository auditEventRepository;

    @Override
    public LotteryDataQualityReport report() {
        List<Record> records = recordService.findAll();
        List<String> duplicateIssues = duplicateIssues(records);
        List<String> missingIssues = missingIssues(records);
        List<String> malformedIssues = records.stream()
                .filter(this::malformed)
                .map(Record::getCode)
                .filter(StringUtils::hasText)
                .sorted()
                .toList();
        List<String> futureDateIssues = records.stream()
                .filter(this::futureDate)
                .map(Record::getCode)
                .filter(StringUtils::hasText)
                .sorted()
                .toList();
        List<String> outOfOrderLineIssues = outOfOrderLineIssues(records);
        List<String> staleReasons = staleDerivedDataReasons(records);
        return LotteryDataQualityReport.builder()
                .totalRecords(records.size())
                .missingIssueCount(missingIssues.size())
                .duplicateIssueCount(duplicateIssues.size())
                .malformedRecordCount(malformedIssues.size())
                .invalidNumberCount(malformedIssues.size())
                .outOfOrderLineCount(outOfOrderLineIssues.size())
                .futureDateCount(futureDateIssues.size())
                .staleDerivedDataCount(staleReasons.size())
                .missingIssues(limit(missingIssues))
                .duplicateIssues(limit(duplicateIssues))
                .malformedIssues(limit(malformedIssues))
                .outOfOrderLineIssues(limit(outOfOrderLineIssues))
                .futureDateIssues(limit(futureDateIssues))
                .staleDerivedDataReasons(limit(staleReasons))
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    @Override
    public LotteryDataQualityRepairResult dryRunMissingIssuesRepair(LotteryDataQualityRepairRequest request) {
        return repairMissingIssues(request, true);
    }

    @Override
    public LotteryDataQualityRepairResult confirmMissingIssuesRepair(LotteryDataQualityRepairRequest request) {
        return repairMissingIssues(request, false);
    }

    private LotteryDataQualityRepairResult repairMissingIssues(LotteryDataQualityRepairRequest request, boolean dryRun) {
        if (!dryRun && !Boolean.TRUE.equals(request == null ? null : request.getConfirm())) {
            throw new IllegalArgumentException("确认修复缺失期号必须传入 confirm=true");
        }
        List<Record> currentRecords = recordService.findAll();
        List<String> currentMissingIssues = missingIssues(currentRecords);
        List<String> requestedIssues = requestedIssues(request, currentMissingIssues);
        Map<String, Record> providerRecords = fetchProviderRecords(requestedIssues);
        List<String> repairableIssues = requestedIssues.stream()
                .filter(providerRecords::containsKey)
                .toList();
        List<String> skippedIssues = requestedIssues.stream()
                .filter(issue -> !providerRecords.containsKey(issue))
                .toList();

        int renumberedRecordCount = 0;
        boolean cacheInvalidated = false;
        if (!dryRun && !repairableIssues.isEmpty()) {
            List<Record> repairedRecords = repairableIssues.stream()
                    .map(providerRecords::get)
                    .toList();
            List<Record> reorderedRecords = reorderedRecords(currentRecords, repairedRecords);
            recordService.saveAll(reorderedRecords);
            renumberedRecordCount = reorderedRecords.size();
            statisticsService.invalidateCache();
            cacheInvalidated = true;
        }

        int missingAfter = dryRun ? currentMissingIssues.size() : Math.max(0, currentMissingIssues.size() - repairableIssues.size());
        LotteryDataQualityRepairResult result = LotteryDataQualityRepairResult.builder()
                .repairType("MISSING_ISSUES")
                .dryRun(dryRun)
                .missingBefore(currentMissingIssues.size())
                .missingAfter(missingAfter)
                .requestedIssueCount(requestedIssues.size())
                .repairableIssueCount(repairableIssues.size())
                .repairedIssueCount(dryRun ? 0 : repairableIssues.size())
                .skippedIssueCount(skippedIssues.size())
                .insertedIssueCount(dryRun ? 0 : repairableIssues.size())
                .renumberedRecordCount(renumberedRecordCount)
                .cacheInvalidated(cacheInvalidated)
                .confirmRequired(dryRun && !repairableIssues.isEmpty())
                .confirmed(!dryRun && Boolean.TRUE.equals(request == null ? null : request.getConfirm()))
                .requestedIssues(requestedIssues)
                .repairableIssues(repairableIssues)
                .repairedIssues(dryRun ? List.of() : repairableIssues)
                .skippedIssues(skippedIssues)
                .insertIssues(repairableIssues)
                .repairSteps(repairSteps(dryRun, repairableIssues, skippedIssues, currentRecords.size()))
                .message(repairMessage(dryRun, repairableIssues.size(), skippedIssues.size()))
                .generatedAt(System.currentTimeMillis())
                .build();
        result.setAuditEventId(saveRepairAudit(result, request));
        return result;
    }

    private List<String> duplicateIssues(List<Record> records) {
        Map<String, Long> issueCounts = records.stream()
                .map(Record::getCode)
                .filter(StringUtils::hasText)
                .collect(Collectors.groupingBy(issue -> issue, LinkedHashMap::new, Collectors.counting()));
        return issueCounts.entrySet().stream()
                .filter(entry -> entry.getValue() > 1)
                .map(Map.Entry::getKey)
                .sorted()
                .toList();
    }

    private List<String> requestedIssues(LotteryDataQualityRepairRequest request, List<String> currentMissingIssues) {
        int limit = normalizeRepairLimit(request == null ? null : request.getLimit());
        List<String> requestIssues = request == null ? List.of() : request.getIssues();
        List<String> sourceIssues = CollectionUtils.isEmpty(requestIssues) ? currentMissingIssues : requestIssues;
        String issueStart = normalizeIssue(request == null ? null : request.getIssueStart());
        String issueEnd = normalizeIssue(request == null ? null : request.getIssueEnd());
        return sourceIssues.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .filter(issue -> issue.matches("\\d{7}"))
                .filter(issue -> issueStart == null || issue.compareTo(issueStart) >= 0)
                .filter(issue -> issueEnd == null || issue.compareTo(issueEnd) <= 0)
                .distinct()
                .sorted()
                .limit(limit)
                .toList();
    }

    private Map<String, Record> fetchProviderRecords(List<String> requestedIssues) {
        if (requestedIssues.isEmpty()) {
            return Map.of();
        }
        Set<String> requestedIssueSet = new HashSet<>(requestedIssues);
        List<Record> providerRecords = lotteryDrawProvider.fetchYearlyRecords();
        if (providerRecords == null) {
            return Map.of();
        }
        return providerRecords.stream()
                .filter(record -> record != null && requestedIssueSet.contains(record.getCode()))
                .collect(Collectors.toMap(Record::getCode, record -> record, (left, right) -> left, LinkedHashMap::new));
    }

    private List<Record> reorderedRecords(List<Record> currentRecords, List<Record> repairedRecords) {
        Map<String, Record> recordsByIssue = new LinkedHashMap<>();
        currentRecords.stream()
                .filter(record -> record != null && StringUtils.hasText(record.getCode()))
                .forEach(record -> recordsByIssue.putIfAbsent(record.getCode(), record));
        repairedRecords.stream()
                .filter(record -> record != null && StringUtils.hasText(record.getCode()))
                .forEach(record -> recordsByIssue.putIfAbsent(record.getCode(), record));
        List<Record> records = recordsByIssue.values().stream()
                .sorted(Comparator.comparing(Record::getCode))
                .toList();
        for (int index = 0; index < records.size(); index++) {
            Record record = records.get(index);
            record.setLine(index + 1L);
            if (StringUtils.hasText(record.getDate()) && record.getDate().length() > 10) {
                record.setDate(record.date());
            }
        }
        return records;
    }

    private List<String> missingIssues(List<Record> records) {
        Map<String, Set<Integer>> sequencesByYear = new LinkedHashMap<>();
        for (Record record : records) {
            IssueParts issue = parseIssue(record.getCode());
            if (issue == null) {
                continue;
            }
            sequencesByYear.computeIfAbsent(issue.year(), ignored -> new HashSet<>()).add(issue.sequence());
        }
        List<String> missingIssues = new ArrayList<>();
        for (Map.Entry<String, Set<Integer>> entry : sequencesByYear.entrySet()) {
            List<Integer> sequences = entry.getValue().stream().sorted().toList();
            if (sequences.size() < 2) {
                continue;
            }
            for (int sequence = sequences.get(0); sequence <= sequences.get(sequences.size() - 1); sequence++) {
                if (!entry.getValue().contains(sequence)) {
                    missingIssues.add(entry.getKey() + String.format("%03d", sequence));
                }
            }
        }
        missingIssues.sort(Comparator.naturalOrder());
        return missingIssues;
    }

    private List<String> outOfOrderLineIssues(List<Record> records) {
        List<Record> sortedRecords = records.stream()
                .filter(record -> record != null && StringUtils.hasText(record.getCode()))
                .sorted(Comparator.comparing(Record::getCode))
                .toList();
        List<String> issues = new ArrayList<>();
        for (int index = 0; index < sortedRecords.size(); index++) {
            Record record = sortedRecords.get(index);
            long expectedLine = index + 1L;
            if (!Objects.equals(record.getLine(), expectedLine)) {
                issues.add(record.getCode());
            }
        }
        return issues;
    }

    private List<String> staleDerivedDataReasons(List<Record> records) {
        try {
            LotteryStatisticsSummary summary = statisticsService.summary();
            if (summary == null) {
                return List.of();
            }
            List<String> reasons = new ArrayList<>();
            if (summary.getTotalDraws() != records.size()) {
                reasons.add("统计缓存记录数 " + summary.getTotalDraws() + " 与开奖记录数 " + records.size() + " 不一致");
            }
            String latestIssue = records.stream()
                    .map(Record::getCode)
                    .filter(StringUtils::hasText)
                    .max(Comparator.naturalOrder())
                    .orElse(null);
            if (StringUtils.hasText(summary.getLatestIssue()) && StringUtils.hasText(latestIssue) && !latestIssue.equals(summary.getLatestIssue())) {
                reasons.add("统计缓存最新期号 " + summary.getLatestIssue() + " 与开奖记录最新期号 " + latestIssue + " 不一致");
            }
            return reasons;
        } catch (RuntimeException exception) {
            return List.of("统计缓存读取失败: " + exception.getMessage());
        }
    }

    private boolean malformed(Record record) {
        IssueParts issue = parseIssue(record.getCode());
        if (issue == null) {
            return true;
        }
        List<Integer> redNumbers = parseNumbers(record.getRed());
        List<Integer> blueNumbers = parseNumbers(record.getBlue());
        return redNumbers.size() != 6
                || new HashSet<>(redNumbers).size() != 6
                || redNumbers.stream().anyMatch(number -> number < 1 || number > 33)
                || blueNumbers.size() != 1
                || blueNumbers.get(0) < 1
                || blueNumbers.get(0) > 16;
    }

    private boolean futureDate(Record record) {
        if (!StringUtils.hasText(record.getDate())) {
            return false;
        }
        try {
            return LocalDate.parse(record.getDate().substring(0, Math.min(10, record.getDate().length())))
                    .isAfter(LocalDate.now());
        } catch (DateTimeParseException exception) {
            return false;
        }
    }

    private List<Integer> parseNumbers(String value) {
        if (!StringUtils.hasText(value)) {
            return List.of();
        }
        List<Integer> numbers = new ArrayList<>();
        for (String part : value.split("[,，\\s]+")) {
            if (!StringUtils.hasText(part)) {
                continue;
            }
            try {
                numbers.add(Integer.parseInt(part.trim()));
            } catch (NumberFormatException exception) {
                return List.of();
            }
        }
        return numbers;
    }

    private IssueParts parseIssue(String issue) {
        if (!StringUtils.hasText(issue) || !issue.matches("\\d{7}")) {
            return null;
        }
        return new IssueParts(issue.substring(0, 4), Integer.parseInt(issue.substring(4)));
    }

    private List<String> limit(List<String> values) {
        return values.stream().limit(SAMPLE_LIMIT).toList();
    }

    private List<String> repairSteps(boolean dryRun,
                                     List<String> repairableIssues,
                                     List<String> skippedIssues,
                                     int currentRecordCount) {
        List<String> steps = new ArrayList<>();
        if (repairableIssues.isEmpty()) {
            steps.add("没有 provider 可证明的缺失期号可写入");
        } else if (dryRun) {
            steps.add("确认后将插入 " + repairableIssues.size() + " 个 provider 可证明的缺失期号");
            steps.add("确认后将按期号重排 " + (currentRecordCount + repairableIssues.size()) + " 条开奖记录 line");
            steps.add("确认后将刷新彩票统计 Redis 缓存");
        } else {
            steps.add("已插入 " + repairableIssues.size() + " 个 provider 可证明的缺失期号");
            steps.add("已按期号重排 " + (currentRecordCount + repairableIssues.size()) + " 条开奖记录 line");
            steps.add("已刷新彩票统计 Redis 缓存");
        }
        if (!skippedIssues.isEmpty()) {
            steps.add("跳过 " + skippedIssues.size() + " 个 provider 未返回的期号");
        }
        return steps;
    }

    private String saveRepairAudit(LotteryDataQualityRepairResult result, LotteryDataQualityRepairRequest request) {
        try {
            Map<String, String> filters = new LinkedHashMap<>();
            filters.put("repairType", result.getRepairType());
            filters.put("dryRun", String.valueOf(result.getDryRun()));
            filters.put("confirmed", String.valueOf(result.getConfirmed()));
            filters.put("limit", String.valueOf(normalizeRepairLimit(request == null ? null : request.getLimit())));
            if (StringUtils.hasText(request == null ? null : request.getIssueStart())) {
                filters.put("issueStart", request.getIssueStart().trim());
            }
            if (StringUtils.hasText(request == null ? null : request.getIssueEnd())) {
                filters.put("issueEnd", request.getIssueEnd().trim());
            }
            filters.put("requestedIssueCount", String.valueOf(result.getRequestedIssueCount()));
            filters.put("repairableIssueCount", String.valueOf(result.getRepairableIssueCount()));
            filters.put("skippedIssueCount", String.valueOf(result.getSkippedIssueCount()));
            LotteryAuditEvent event = auditEventRepository.save(LotteryAuditEvent.builder()
                    .eventType(Boolean.TRUE.equals(result.getDryRun()) ? "DATA_QUALITY_REPAIR_DRY_RUN" : "DATA_QUALITY_REPAIR_CONFIRM")
                    .targetType("lottery-data-quality")
                    .targetId(UUID.randomUUID().toString())
                    .requesterScope("default")
                    .filters(filters)
                    .rowCount(Boolean.TRUE.equals(result.getDryRun()) ? result.getRepairableIssueCount() : result.getRepairedIssueCount())
                    .message(result.getMessage())
                    .generatedAt(result.getGeneratedAt())
                    .build());
            return event == null ? null : event.getTargetId();
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private static String normalizeIssue(String issue) {
        if (!StringUtils.hasText(issue)) {
            return null;
        }
        String value = issue.trim();
        return value.matches("\\d{7}") ? value : null;
    }

    private static int normalizeRepairLimit(Integer limit) {
        if (limit == null || limit <= 0) {
            return DEFAULT_REPAIR_LIMIT;
        }
        return Math.min(limit, MAX_REPAIR_LIMIT);
    }

    private static String repairMessage(boolean dryRun, int repairableCount, int skippedCount) {
        if (dryRun) {
            return "缺失期号修复计划已生成，可修复 " + repairableCount + " 项，跳过 " + skippedCount + " 项";
        }
        return "缺失期号修复完成，已修复 " + repairableCount + " 项，跳过 " + skippedCount + " 项";
    }

    private record IssueParts(String year, int sequence) {
    }
}
