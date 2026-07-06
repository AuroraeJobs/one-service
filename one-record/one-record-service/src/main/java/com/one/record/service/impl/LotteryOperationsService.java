package com.one.record.service.impl;

import com.one.record.lottery.LotteryDataQualityReport;
import com.one.record.lottery.LotteryDecisionOutcomeSummary;
import com.one.record.lottery.LotteryDraw;
import com.one.record.lottery.LotteryOperationsHealthAcknowledgeRequest;
import com.one.record.lottery.LotteryOperationsHealthContributor;
import com.one.record.lottery.LotteryOperationsHealthSummary;
import com.one.record.lottery.LotteryRecordSyncSummary;
import com.one.record.lottery.LotteryTicketSummary;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.service.ILotteryDataQualityService;
import com.one.record.service.ILotteryDecisionSetService;
import com.one.record.service.ILotteryOperationsService;
import com.one.record.service.ILotteryRecordSyncLogService;
import com.one.record.service.ILotteryTicketService;
import com.one.record.service.IRecordService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
public class LotteryOperationsService implements ILotteryOperationsService {

    private static final int SYNC_SUMMARY_LIMIT = 50;

    private final IRecordService recordService;

    private final ILotteryRecordSyncLogService syncLogService;

    private final ILotteryDataQualityService dataQualityService;

    private final ILotteryTicketService ticketService;

    private final ILotteryDecisionSetService decisionSetService;

    private final LotteryAuditEventRepository auditEventRepository;

    @Override
    public LotteryOperationsHealthSummary health() {
        LotteryDraw latestDraw = recordService.findLastDraw();
        LotteryRecordSyncSummary syncSummary = syncLogService.summary(SYNC_SUMMARY_LIMIT);
        LotteryDataQualityReport qualityReport = dataQualityService.report();
        int qualityIssueCount = qualityIssueCount(qualityReport);
        LotteryTicketSummary ticketSummary = ticketService.summary();
        LotteryDecisionOutcomeSummary outcomeSummary = decisionSetService.outcomeSummary(false, 30);
        List<LotteryAuditEvent> recentAudits = auditEventRepository.findByOrderByGeneratedAtDesc(PageRequest.of(0, 50));
        long now = System.currentTimeMillis();
        saveAudit("DATA_QUALITY_REFRESH", "lottery-data-quality", null, qualityIssueCount, Map.of(
                "source", "operations-health",
                "issueCount", String.valueOf(qualityIssueCount)
        ), "Refreshed data quality for operations health");
        List<LotteryOperationsHealthContributor> contributors = List.of(
                providerContributor(latestDraw, now),
                syncContributor(syncSummary),
                qualityContributor(qualityReport),
                ticketContributor(ticketSummary),
                decisionContributor(outcomeSummary),
                exportContributor(recentAudits)
        );
        int totalWeight = contributors.stream().mapToInt(item -> safeInt(item.getWeight())).sum();
        int weightedScore = totalWeight <= 0 ? 0 : (int) Math.round(contributors.stream()
                .mapToInt(item -> safeInt(item.getScore()) * safeInt(item.getWeight()))
                .sum() / (double) totalWeight);
        long warningCount = contributors.stream().filter(item -> !"PASS".equals(item.getStatus())).count();
        int pendingActionCount = contributors.stream().mapToInt(item -> safeInt(item.getPendingCount())).sum();
        LotteryOperationsHealthSummary summary = LotteryOperationsHealthSummary.builder()
                .score(weightedScore)
                .status(healthStatus(weightedScore, warningCount))
                .message(healthMessage(weightedScore, warningCount))
                .latestIssue(latestDraw == null ? null : latestDraw.getIssue())
                .nextIssue(nextIssue(latestDraw))
                .warningCount((int) warningCount)
                .pendingActionCount(pendingActionCount)
                .contributors(contributors)
                .generatedAt(now)
                .build();
        saveAudit("LOTTERY_HEALTH_GENERATE", "lottery-operations-health", null, contributors.size(), Map.of(
                "score", String.valueOf(weightedScore),
                "status", summary.getStatus(),
                "warningCount", String.valueOf(warningCount)
        ), summary.getMessage());
        return summary;
    }

    @Override
    public LotteryOperationsHealthSummary acknowledgeHealth(LotteryOperationsHealthAcknowledgeRequest request) {
        String key = request == null ? null : request.getContributorKey();
        saveAudit("LOTTERY_HEALTH_ACKNOWLEDGE", "lottery-operations-health", key, 1, Map.of(
                "contributorKey", StringUtils.hasText(key) ? key : "all",
                "note", request == null || !StringUtils.hasText(request.getNote()) ? "" : request.getNote().trim()
        ), "Acknowledged lottery operations health");
        return health();
    }

    private LotteryOperationsHealthContributor providerContributor(LotteryDraw latestDraw, long now) {
        long ageHours = latestDraw == null || latestDraw.getUpdatedAt() == null
                ? Long.MAX_VALUE
                : Math.max(0, (now - latestDraw.getUpdatedAt()) / 3_600_000L);
        int score = latestDraw == null ? 0 : ageHours <= 48 ? 100 : ageHours <= 96 ? 75 : 45;
        return contributor("provider-freshness", "Provider freshness", score, 18,
                latestDraw == null ? "No latest draw is available" : "Latest issue " + latestDraw.getIssue() + " refreshed " + printableAge(ageHours),
                "/lottery/data-quality", latestDraw == null || ageHours > 96 ? 1 : 0,
                latestDraw == null ? null : latestDraw.getUpdatedAt());
    }

    private LotteryOperationsHealthContributor syncContributor(LotteryRecordSyncSummary summary) {
        String latestStatus = summary == null ? null : summary.getLatestStatus();
        int score = "SUCCESS".equals(latestStatus) ? 100 : "SKIPPED".equals(latestStatus) ? 85 : "RUNNING".equals(latestStatus) ? 70 : 45;
        if (summary == null || summary.getTotalCount() == null || summary.getTotalCount() == 0) {
            score = 55;
        }
        return contributor("record-sync", "Record sync", score, 16,
                summary == null ? "No sync summary is available" : nullSafe(summary.getLatestMessage(), "Latest sync " + nullSafe(latestStatus, "UNKNOWN")),
                "/lottery/sync", "FAILED".equals(latestStatus) ? 1 : 0,
                summary == null ? null : summary.getLatestFinishedAt());
    }

    private LotteryOperationsHealthContributor qualityContributor(LotteryDataQualityReport report) {
        int issueCount = qualityIssueCount(report);
        int score = Math.max(35, 100 - issueCount * 12);
        return contributor("data-quality", "Data quality", score, 18,
                issueCount == 0 ? "No data-quality issues detected" : issueCount + " data-quality items need review",
                "/lottery/data-quality", issueCount,
                report == null ? null : report.getGeneratedAt());
    }

    private LotteryOperationsHealthContributor ticketContributor(LotteryTicketSummary summary) {
        int pending = summary == null ? 0 : safeInt(summary.getPendingTicketCount());
        int total = summary == null ? 0 : safeInt(summary.getTicketCount());
        int score = total == 0 ? 80 : Math.max(45, 100 - pending * 10);
        return contributor("ticket-settlement", "Ticket settlement", score, 14,
                total == 0 ? "No ticket records yet" : pending + " tickets still need settlement",
                "/lottery/tickets", pending,
                summary == null ? null : summary.getGeneratedAt());
    }

    private LotteryOperationsHealthContributor decisionContributor(LotteryDecisionOutcomeSummary summary) {
        int converted = summary == null ? 0 : safeInt(summary.getConvertedTicketCount());
        int checked = summary == null ? 0 : safeInt(summary.getCheckedConvertedTicketCount());
        int unchecked = Math.max(0, converted - checked);
        int warnings = summary == null ? 0 : safeInt(summary.getWarningCount())
                + safeInt(summary.getStaleEvidenceCount())
                + safeInt(summary.getVolatileEvidenceCount());
        int score = Math.max(35, 100 - unchecked * 12 - warnings * 4);
        return contributor("decision-outcomes", "Decision outcomes", score, 20,
                unchecked == 0 && warnings == 0 ? "Saved decision outcomes are complete" : unchecked + " unchecked conversions and " + warnings + " evidence warnings",
                "/lottery/predictions/decision", unchecked + warnings,
                summary == null ? null : summary.getGeneratedAt());
    }

    private LotteryOperationsHealthContributor exportContributor(List<LotteryAuditEvent> recentAudits) {
        LotteryAuditEvent latestExport = recentAudits == null ? null : recentAudits.stream()
                .filter(item -> "EXPORT".equals(item.getEventType()) || "REPORT_EXPORT".equals(item.getEventType()) || "decision-outcomes".equals(item.getTargetType()))
                .max(Comparator.comparing(event -> event.getGeneratedAt() == null ? 0L : event.getGeneratedAt()))
                .orElse(null);
        int score = latestExport == null ? 60 : 100;
        return contributor("export-evidence", "Export evidence", score, 14,
                latestExport == null ? "No recent export evidence found" : "Latest export evidence " + nullSafe(latestExport.getTargetType(), latestExport.getEventType()),
                "/lottery/exports", latestExport == null ? 1 : 0,
                latestExport == null ? null : latestExport.getGeneratedAt());
    }

    private LotteryOperationsHealthContributor contributor(String key,
                                                           String label,
                                                           int score,
                                                           int weight,
                                                           String message,
                                                           String path,
                                                           int pendingCount,
                                                           Long updatedAt) {
        int boundedScore = Math.max(0, Math.min(100, score));
        return LotteryOperationsHealthContributor.builder()
                .key(key)
                .label(label)
                .score(boundedScore)
                .weight(weight)
                .status(contributorStatus(boundedScore, pendingCount))
                .message(message)
                .path(path)
                .pendingCount(pendingCount)
                .updatedAt(updatedAt)
                .build();
    }

    private void saveAudit(String eventType, String targetType, String targetId, int rowCount, Map<String, String> filters, String message) {
        auditEventRepository.save(LotteryAuditEvent.builder()
                .eventType(eventType)
                .targetType(targetType)
                .targetId(targetId)
                .requesterScope("lottery-operations")
                .filters(new LinkedHashMap<>(filters))
                .rowCount(rowCount)
                .message(message)
                .generatedAt(System.currentTimeMillis())
                .build());
    }

    private static int qualityIssueCount(LotteryDataQualityReport report) {
        if (report == null) {
            return 0;
        }
        return safeInt(report.getMissingIssueCount())
                + safeInt(report.getDuplicateIssueCount())
                + safeInt(report.getMalformedRecordCount())
                + safeInt(report.getInvalidNumberCount())
                + safeInt(report.getOutOfOrderLineCount())
                + safeInt(report.getFutureDateCount())
                + safeInt(report.getStaleDerivedDataCount());
    }

    private static String healthStatus(int score, long warningCount) {
        if (score >= 90 && warningCount == 0) {
            return "PASS";
        }
        if (score >= 70) {
            return "WARNING";
        }
        return "FAILED";
    }

    private static String contributorStatus(int score, int pendingCount) {
        if (score >= 90 && pendingCount == 0) {
            return "PASS";
        }
        if (score >= 70) {
            return "WARNING";
        }
        return "FAILED";
    }

    private static String healthMessage(int score, long warningCount) {
        if (score >= 90 && warningCount == 0) {
            return "彩票运营已就绪";
        }
        if (score >= 70) {
            return "月末前需要复核彩票运营";
        }
        return "彩票运营需要关注";
    }

    private static String nextIssue(LotteryDraw latestDraw) {
        if (latestDraw == null || !StringUtils.hasText(latestDraw.getIssue())) {
            return null;
        }
        try {
            return String.valueOf(Long.parseLong(latestDraw.getIssue()) + 1);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static String printableAge(long hours) {
        if (hours == Long.MAX_VALUE) {
            return "unknown";
        }
        if (hours < 24) {
            return hours + "h ago";
        }
        return (hours / 24) + "d ago";
    }

    private static String nullSafe(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }

    private static int safeInt(Integer value) {
        return value == null ? 0 : value;
    }
}
