package com.one.record.service.impl;

import com.one.record.lottery.LotteryExportResult;
import com.one.record.lottery.LotteryIssueLedger;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryBacktestReport;
import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.model.LotteryProviderProbeLog;
import com.one.record.model.LotteryRecordSyncLog;
import com.one.record.model.LotteryStrategyExperiment;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryBacktestReportRepository;
import com.one.record.repository.LotteryPredictionSnapshotRepository;
import com.one.record.repository.LotteryProviderProbeLogRepository;
import com.one.record.repository.LotteryRecordSyncLogRepository;
import com.one.record.repository.LotteryStrategyExperimentRepository;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.service.ILotteryExportService;
import com.one.record.service.ILotteryLedgerService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@AllArgsConstructor
public class LotteryExportService implements ILotteryExportService {

    private static final String REQUESTER_SCOPE = "default";

    private static final int DEFAULT_LIMIT = 500;

    private static final int MAX_LIMIT = 2000;

    private static final int MAX_PAGE_SIZE = 200;

    private final LotteryTicketRepository ticketRepository;

    private final LotteryPredictionSnapshotRepository predictionSnapshotRepository;

    private final LotteryStrategyExperimentRepository experimentRepository;

    private final LotteryBacktestReportRepository backtestReportRepository;

    private final LotteryRecordSyncLogRepository syncLogRepository;

    private final LotteryProviderProbeLogRepository probeLogRepository;

    private final LotteryAuditEventRepository auditEventRepository;

    private final ILotteryLedgerService ledgerService;

    @Override
    public LotteryExportResult export(String type, Map<String, String> filters) {
        String exportType = normalizeType(type);
        Map<String, String> safeFilters = normalizeFilters(filters);
        List<Map<String, String>> rows = rows(exportType, safeFilters);
        String exportId = UUID.randomUUID().toString();
        long now = System.currentTimeMillis();
        LotteryAuditEvent event = auditEventRepository.save(LotteryAuditEvent.builder()
                .eventType("EXPORT")
                .targetType(exportType)
                .targetId(exportId)
                .requesterScope(REQUESTER_SCOPE)
                .filters(safeFilters)
                .rowCount(rows.size())
                .message("Exported " + exportType)
                .generatedAt(now)
                .build());
        return LotteryExportResult.builder()
                .exportId(event.getTargetId() == null ? exportId : event.getTargetId())
                .exportType(exportType)
                .format("CSV")
                .filters(safeFilters)
                .rowCount(rows.size())
                .requesterScope(REQUESTER_SCOPE)
                .generatedAt(now)
                .fileName("lottery-" + exportType + "-" + now + ".csv")
                .content(csv(rows))
                .build();
    }

    @Override
    public LotteryPageResponse<LotteryAuditEvent> auditEvents(Integer page, Integer pageSize) {
        int currentPage = normalizePage(page);
        int currentPageSize = normalizePageSize(pageSize);
        long total = auditEventRepository.count();
        List<LotteryAuditEvent> items = auditEventRepository.findByOrderByGeneratedAtDesc(PageRequest.of(currentPage - 1, currentPageSize));
        return LotteryPageResponse.<LotteryAuditEvent>builder()
                .items(items)
                .page(currentPage)
                .pageSize(currentPageSize)
                .total(total)
                .hasNext((long) currentPage * currentPageSize < total)
                .build();
    }

    private List<Map<String, String>> rows(String type, Map<String, String> filters) {
        return switch (type) {
            case "tickets" -> ticketRows(filters);
            case "ledger-issues" -> ledgerIssueRows(filters);
            case "predictions" -> predictionRows(filters);
            case "experiments" -> experimentRows(filters);
            case "backtests" -> backtestRows(filters);
            case "sync-logs" -> syncLogRows(filters);
            case "probe-logs" -> probeLogRows(filters);
            default -> throw new IllegalArgumentException("不支持的导出类型: " + type);
        };
    }

    private List<Map<String, String>> ticketRows(Map<String, String> filters) {
        String issue = filters.get("issue");
        String status = upper(filters.get("status"));
        String source = upper(filters.get("source"));
        return limit(ticketRepository.findAll(Sort.by(Sort.Direction.DESC, "period", "createdAt")).stream()
                .filter(ticket -> !hasText(issue) || issue.equals(ticket.getIssue()))
                .filter(ticket -> !hasText(status) || status.equals(upper(ticket.getStatus())))
                .filter(ticket -> !hasText(source) || source.equals(upper(ticket.getSource())))
                .map(ticket -> row(
                        "id", value(ticket.getId()),
                        "issue", value(ticket.getIssue()),
                        "status", value(ticket.getStatus()),
                        "source", value(ticket.getSource()),
                        "quantity", value(ticket.getQuantity()),
                        "cost", money(ticket.getCost()),
                        "redNumbers", String.join(" ", ticket.getRedNumbers() == null ? List.of() : ticket.getRedNumbers()),
                        "blueNumber", value(ticket.getBlueNumber()),
                        "prizeGrade", value(ticket.getPrizeGrade()),
                        "createdAt", value(ticket.getCreatedAt())
                ))
                .toList(), filters);
    }

    private List<Map<String, String>> ledgerIssueRows(Map<String, String> filters) {
        String issue = filters.get("issue");
        return limit(ledgerService.issues().stream()
                .filter(row -> !hasText(issue) || issue.equals(row.getIssue()))
                .map(item -> row(
                        "issue", value(item.getIssue()),
                        "ticketCount", value(item.getTicketCount()),
                        "checkedTicketCount", value(item.getCheckedTicketCount()),
                        "pendingTicketCount", value(item.getPendingTicketCount()),
                        "winningTicketCount", value(item.getWinningTicketCount()),
                        "totalCost", money(item.getTotalCost()),
                        "totalPrize", money(item.getTotalPrize()),
                        "netResult", money(item.getNetResult()),
                        "roiPercent", money(item.getRoiPercent())
                ))
                .toList(), filters);
    }

    private List<Map<String, String>> predictionRows(Map<String, String> filters) {
        String targetPeriod = filters.get("targetPeriod");
        String ruleId = filters.get("ruleId");
        return limit(predictionSnapshotRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .filter(snapshot -> !hasText(targetPeriod) || targetPeriod.equals(value(snapshot.getTargetPeriod())))
                .filter(snapshot -> !hasText(ruleId) || ruleId.equals(snapshot.getRuleId()))
                .map(snapshot -> row(
                        "id", value(snapshot.getId()),
                        "title", value(snapshot.getTitle()),
                        "targetPeriod", value(snapshot.getTargetPeriod()),
                        "ruleId", value(snapshot.getRuleId()),
                        "ruleName", value(snapshot.getRuleName()),
                        "score", value(snapshot.getScore()),
                        "redNumbers", String.join(" ", snapshot.getRedNumbers() == null ? List.of() : snapshot.getRedNumbers()),
                        "blueNumber", value(snapshot.getBlueNumber()),
                        "createdAt", value(snapshot.getCreatedAt())
                ))
                .toList(), filters);
    }

    private List<Map<String, String>> experimentRows(Map<String, String> filters) {
        String strategyName = upper(filters.get("strategyName"));
        return limit(experimentRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .filter(item -> !hasText(strategyName) || containsUpper(item.getStrategyName(), strategyName))
                .map(item -> row(
                        "id", value(item.getId()),
                        "strategyName", value(item.getStrategyName()),
                        "scale", value(item.getScale()),
                        "replayWindow", value(item.getReplayWindow()),
                        "inputSource", value(item.getInputSource()),
                        "tags", String.join(" ", item.getTags() == null ? List.of() : item.getTags()),
                        "createdAt", value(item.getCreatedAt())
                ))
                .toList(), filters);
    }

    private List<Map<String, String>> backtestRows(Map<String, String> filters) {
        String strategyName = upper(filters.get("strategyName"));
        String presetWindow = lower(filters.get("presetWindow"));
        return limit(backtestReportRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .filter(item -> !hasText(strategyName) || containsUpper(item.getStrategyName(), strategyName))
                .filter(item -> !hasText(presetWindow) || presetWindow.equals(lower(item.getPresetWindow())))
                .map(item -> row(
                        "id", value(item.getId()),
                        "strategyName", value(item.getStrategyName()),
                        "presetWindow", value(item.getPresetWindow()),
                        "issueStart", value(item.getIssueStart()),
                        "issueEnd", value(item.getIssueEnd()),
                        "replayCount", value(item.getReplayCount()),
                        "netResult", money(item.getNetResult()),
                        "stabilityScore", value(item.getStabilityScore()),
                        "createdAt", value(item.getCreatedAt())
                ))
                .toList(), filters);
    }

    private List<Map<String, String>> syncLogRows(Map<String, String> filters) {
        String status = upper(filters.get("status"));
        return limit(syncLogRepository.findAll(Sort.by(Sort.Direction.DESC, "startedAt")).stream()
                .filter(log -> !hasText(status) || status.equals(upper(log.getStatus())))
                .map(log -> row(
                        "id", value(log.getId()),
                        "jobName", value(log.getJobName()),
                        "status", value(log.getStatus()),
                        "startIssue", value(log.getStartIssue()),
                        "endIssue", value(log.getEndIssue()),
                        "savedCount", value(log.getSavedCount()),
                        "message", value(log.getMessage()),
                        "startedAt", value(log.getStartedAt()),
                        "finishedAt", value(log.getFinishedAt())
                ))
                .toList(), filters);
    }

    private List<Map<String, String>> probeLogRows(Map<String, String> filters) {
        String provider = upper(filters.get("provider"));
        return limit(probeLogRepository.findAll(Sort.by(Sort.Direction.DESC, "checkedAt")).stream()
                .filter(log -> !hasText(provider) || provider.equals(upper(log.getProvider())))
                .map(log -> row(
                        "id", value(log.getId()),
                        "provider", value(log.getProvider()),
                        "status", value(log.getStatus()),
                        "success", value(log.getSuccess()),
                        "recordCount", value(log.getRecordCount()),
                        "durationMs", value(log.getDurationMs()),
                        "message", value(log.getMessage()),
                        "checkedAt", value(log.getCheckedAt())
                ))
                .toList(), filters);
    }

    private List<Map<String, String>> limit(List<Map<String, String>> rows, Map<String, String> filters) {
        int limit = normalizeLimit(parseInt(filters.get("limit")));
        return rows.size() <= limit ? rows : rows.subList(0, limit);
    }

    private Map<String, String> row(String... values) {
        Map<String, String> row = new LinkedHashMap<>();
        for (int index = 0; index + 1 < values.length; index += 2) {
            row.put(values[index], values[index + 1]);
        }
        return row;
    }

    private String csv(List<Map<String, String>> rows) {
        if (rows.isEmpty()) {
            return "";
        }
        List<String> headers = new ArrayList<>(rows.get(0).keySet());
        List<String> lines = new ArrayList<>();
        lines.add(String.join(",", headers));
        for (Map<String, String> row : rows) {
            lines.add(headers.stream()
                    .map(header -> escape(row.get(header)))
                    .reduce((left, right) -> left + "," + right)
                    .orElse(""));
        }
        return String.join("\n", lines);
    }

    private String escape(String value) {
        String safe = value == null ? "" : value;
        if (safe.contains(",") || safe.contains("\"") || safe.contains("\n")) {
            return "\"" + safe.replace("\"", "\"\"") + "\"";
        }
        return safe;
    }

    private Map<String, String> normalizeFilters(Map<String, String> filters) {
        Map<String, String> normalized = new LinkedHashMap<>();
        if (filters == null) {
            normalized.put("limit", String.valueOf(DEFAULT_LIMIT));
            return normalized;
        }
        filters.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .filter(entry -> hasText(entry.getValue()))
                .forEach(entry -> normalized.put(entry.getKey(), entry.getValue().trim()));
        normalized.putIfAbsent("limit", String.valueOf(DEFAULT_LIMIT));
        return normalized;
    }

    private String normalizeType(String type) {
        return hasText(type) ? type.trim().toLowerCase(Locale.ROOT) : "";
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null || limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }

    private int normalizePage(Integer page) {
        if (page == null || page <= 0) {
            return 1;
        }
        return page;
    }

    private int normalizePageSize(Integer pageSize) {
        if (pageSize == null || pageSize <= 0) {
            return 20;
        }
        return Math.min(pageSize, MAX_PAGE_SIZE);
    }

    private Integer parseInt(String value) {
        if (!hasText(value)) {
            return null;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String upper(String value) {
        return hasText(value) ? value.trim().toUpperCase(Locale.ROOT) : null;
    }

    private String lower(String value) {
        return hasText(value) ? value.trim().toLowerCase(Locale.ROOT) : null;
    }

    private boolean containsUpper(String value, String expected) {
        return hasText(value) && value.trim().toUpperCase(Locale.ROOT).contains(expected);
    }

    private boolean hasText(String value) {
        return StringUtils.hasText(value);
    }

    private String value(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String money(BigDecimal value) {
        return value == null ? "" : value.toPlainString();
    }
}
