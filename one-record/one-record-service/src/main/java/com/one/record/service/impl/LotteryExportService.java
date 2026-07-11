package com.one.record.service.impl;

import com.one.record.lottery.LotteryDecisionCandidateOutcome;
import com.one.record.lottery.LotteryDecisionOutcomeItem;
import com.one.record.lottery.LotteryDecisionOutcomeSummary;
import com.one.record.lottery.LotteryExportResult;
import com.one.record.lottery.LotteryIssueLedger;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryResearchProvenance;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryBacktestReport;
import com.one.record.model.LotteryDecisionSet;
import com.one.record.model.LotteryPredictionSnapshot;
import com.one.record.model.LotteryPredictionRuleRecord;
import com.one.record.model.LotteryProviderProbeLog;
import com.one.record.model.LotteryRecordSyncLog;
import com.one.record.model.LotteryStrategyExperiment;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryBacktestReportRepository;
import com.one.record.repository.LotteryDecisionSetRepository;
import com.one.record.repository.LotteryPredictionSnapshotRepository;
import com.one.record.repository.LotteryProviderProbeLogRepository;
import com.one.record.repository.LotteryRecordSyncLogRepository;
import com.one.record.repository.LotteryStrategyExperimentRepository;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.service.ILotteryDecisionSetService;
import com.one.record.service.ILotteryExportService;
import com.one.record.service.ILotteryLedgerService;
import com.one.record.service.ILotteryTrainingService;
import com.one.record.training.LotteryReplayMetrics;
import com.one.record.training.LotteryReplaySummary;
import com.one.record.training.LotteryRuleEvidence;
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

    private final LotteryDecisionSetRepository decisionSetRepository;

    private final LotteryPredictionSnapshotRepository predictionSnapshotRepository;

    private final LotteryStrategyExperimentRepository experimentRepository;

    private final LotteryBacktestReportRepository backtestReportRepository;

    private final LotteryRecordSyncLogRepository syncLogRepository;

    private final LotteryProviderProbeLogRepository probeLogRepository;

    private final LotteryAuditEventRepository auditEventRepository;

    private final ILotteryLedgerService ledgerService;

    private final ILotteryTrainingService trainingService;

    private final ILotteryDecisionSetService decisionSetService;

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
            case "rule-evidence" -> ruleEvidenceRows(filters);
            case "replay-evidence" -> replayEvidenceRows(filters);
            case "decision-sets" -> decisionSetRows(filters);
            case "decision-outcomes" -> decisionOutcomeRows(filters);
            case "ticket-import-previews" -> ticketImportPreviewRows(filters);
            case "budget-prechecks" -> budgetPrecheckRows(filters);
            case "settlement-reviews" -> settlementReviewRows(filters);
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
                        "evidenceTag", evidenceTag(snapshot.getEvidence()),
                        "evidenceScore", value(snapshot.getEvidence() == null ? null : snapshot.getEvidence().getScore()),
                        "evidenceMessage", value(snapshot.getEvidence() == null ? null : snapshot.getEvidence().getMessage()),
                        "actualPeriod", value(snapshot.getActualRecord() == null ? null : snapshot.getActualRecord().getPeriod()),
                        "primaryRedHits", value(snapshot.getResult() == null ? null : snapshot.getResult().getRedHits()),
                        "primaryBlueHit", value(snapshot.getResult() == null ? null : snapshot.getResult().isBlueHit()),
                        "createdAt", value(snapshot.getCreatedAt())
                ))
                .toList(), filters);
    }

    private List<Map<String, String>> ruleEvidenceRows(Map<String, String> filters) {
        String ruleName = upper(filters.get("ruleName"));
        return limit(trainingService.comparePredictionRules(normalizeLimit(parseInt(filters.get("limit"))))
                .getRules()
                .stream()
                .filter(rule -> !hasText(ruleName) || containsUpper(rule.getRuleName(), ruleName) || containsUpper(rule.getRuleId(), ruleName))
                .map(rule -> {
                    LotteryRuleEvidence evidence = rule.getEvidence();
                    LotteryReplaySummary replay = rule.getReplaySummary();
                    return row(
                            "id", value(rule.getId()),
                            "ruleId", value(rule.getRuleId()),
                            "ruleName", value(rule.getRuleName()),
                            "generation", value(rule.getGeneration()),
                            "replayCount", value(rule.getReplayCount()),
                            "rankScore", value(rule.getRankScore()),
                            "evidenceTag", evidenceTag(evidence),
                            "evidenceLabel", value(evidence == null ? null : evidence.getLabel()),
                            "evidenceScore", value(evidence == null ? null : evidence.getScore()),
                            "evidenceMessage", value(evidence == null ? null : evidence.getMessage()),
                            "evidenceReasons", reasons(evidence),
                            "stabilityScore", value(rule.getBacktestSummary() == null ? null : rule.getBacktestSummary().getStabilityScore()),
                            "averageRedHits", value(replay == null ? null : replay.getRecentAverageRedHits()),
                            "blueHitRate", value(replay == null ? null : replay.getRecentBlueHitRate()),
                            "prizeDistribution", value(replay == null ? null : replay.getPrizeDistribution()),
                            "createdAt", value(rule.getCreatedAt())
                    );
                })
                .toList(), filters);
    }

    private List<Map<String, String>> replayEvidenceRows(Map<String, String> filters) {
        Integer window = parseInt(filters.get("window"));
        LotteryReplayMetrics metrics = trainingService.replayMetrics(window);
        LotteryReplaySummary replay = metrics.getReplaySummary();
        LotteryRuleEvidence evidence = metrics.getEvidence();
        return List.of(row(
                "requestedWindow", value(metrics.getRequestedWindow()),
                "actualWindow", value(metrics.getActualWindow()),
                "reportReplayCount", value(metrics.getReportReplayCount()),
                "generation", value(metrics.getGeneration()),
                "ruleId", value(replay == null ? null : replay.getRuleId()),
                "ruleName", value(replay == null ? null : replay.getRuleName()),
                "recentAverageScore", value(replay == null ? null : replay.getRecentAverageScore()),
                "averageScoreDrift", value(replay == null ? null : replay.getAverageScoreDrift()),
                "recentAverageRedHits", value(replay == null ? null : replay.getRecentAverageRedHits()),
                "averageRedHitsDrift", value(replay == null ? null : replay.getAverageRedHitsDrift()),
                "recentBlueHitRate", value(replay == null ? null : replay.getRecentBlueHitRate()),
                "blueHitRateDrift", value(replay == null ? null : replay.getBlueHitRateDrift()),
                "driftLabel", value(replay == null ? null : replay.getDriftLabel()),
                "evidenceTag", evidenceTag(evidence),
                "evidenceLabel", value(evidence == null ? null : evidence.getLabel()),
                "evidenceScore", value(evidence == null ? null : evidence.getScore()),
                "evidenceMessage", value(evidence == null ? null : evidence.getMessage()),
                "evidenceReasons", reasons(evidence),
                "prizeDistribution", value(replay == null ? null : replay.getPrizeDistribution()),
                "redHitDistribution", value(replay == null ? null : replay.getRedHitDistribution()),
                "candidatePrizeDistribution", value(replay == null ? null : replay.getCandidatePrizeDistribution()),
                "candidateRedHitDistribution", value(replay == null ? null : replay.getCandidateRedHitDistribution()),
                "generatedAt", value(metrics.getGeneratedAt())
        ));
    }

    private List<Map<String, String>> decisionSetRows(Map<String, String> filters) {
        String targetIssue = filters.get("targetIssue");
        String ruleName = upper(filters.get("ruleName"));
        return limit(decisionSetRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt")).stream()
                .filter(item -> !hasText(targetIssue) || targetIssue.equals(item.getTargetIssue()))
                .filter(item -> !hasText(ruleName) || containsUpper(item.getRuleName(), ruleName) || containsUpper(item.getTitle(), ruleName))
                .map(item -> appendResearchProvenance(row(
                        "id", value(item.getId()),
                        "title", value(item.getTitle()),
                        "targetIssue", value(item.getTargetIssue()),
                        "ruleName", value(item.getRuleName()),
                        "candidateCount", value(item.getSelectedCandidates() == null ? 0 : item.getSelectedCandidates().size()),
                        "candidateKeys", item.getSelectedCandidates() == null ? "" : item.getSelectedCandidates().stream()
                                .map(candidate -> value(candidate.getKey()))
                                .filter(this::hasText)
                                .reduce((left, right) -> left + " | " + right)
                                .orElse(""),
                        "candidateGenerationIds", item.getSelectedCandidates() == null ? "" : item.getSelectedCandidates().stream()
                                .map(candidate -> hasText(candidate.getGenerationId())
                                        ? candidate.getGenerationId()
                                        : candidate.getProvenance() == null ? "" : value(candidate.getProvenance().getGenerationId()))
                                .filter(this::hasText)
                                .reduce((left, right) -> left + " | " + right)
                                .orElse(""),
                        "conversionState", value(item.getConversionState()),
                        "status", value(item.getStatus()),
                        "reviewAction", value(item.getReviewAction()),
                        "reviewBacktestId", value(item.getReviewBacktestId()),
                        "reviewedAt", value(item.getReviewedAt()),
                        "archived", value(item.getArchived()),
                        "createdAt", value(item.getCreatedAt()),
                        "updatedAt", value(item.getUpdatedAt())
                ), item.getProvenance()))
                .toList(), filters);
    }

    private List<Map<String, String>> decisionOutcomeRows(Map<String, String> filters) {
        LotteryDecisionOutcomeSummary summary = decisionSetService.outcomeSummary(bool(filters.get("includeArchived")), parseInt(filters.get("limit")));
        String targetIssue = filters.get("targetIssue");
        String ruleName = upper(filters.get("ruleName"));
        return limit(summary.getItems().stream()
                .filter(item -> !hasText(targetIssue) || targetIssue.equals(item.getTargetIssue()))
                .filter(item -> !hasText(ruleName) || containsUpper(item.getRuleName(), ruleName) || containsUpper(item.getTitle(), ruleName))
                .flatMap(item -> item.getCandidates().stream().map(candidate -> decisionOutcomeRow(item, candidate)))
                .toList(), filters);
    }

    private Map<String, String> decisionOutcomeRow(LotteryDecisionOutcomeItem item,
                                                   LotteryDecisionCandidateOutcome candidate) {
        LotteryResearchProvenance provenance = candidate.getProvenance() == null
                ? item.getProvenance()
                : candidate.getProvenance();
        return appendResearchProvenance(row(
                "decisionSetId", value(item.getDecisionSetId()),
                "title", value(item.getTitle()),
                "targetIssue", value(item.getTargetIssue()),
                "reviewAction", value(item.getReviewAction()),
                "reviewBacktestId", value(item.getReviewBacktestId()),
                "reviewedAt", value(item.getReviewedAt()),
                "backtestNetResultDelta", money(item.getBacktestNetResultDelta()),
                "backtestRoiPercentDelta", money(item.getBacktestRoiPercentDelta()),
                "backtestWarnings", String.join(" | ", item.getBacktestWarnings() == null ? List.of() : item.getBacktestWarnings()),
                "ruleName", value(candidate.getRuleName()),
                "candidateKey", value(candidate.getCandidateKey()),
                "candidateGenerationId", value(candidate.getGenerationId()),
                "candidateTitle", value(candidate.getCandidateTitle()),
                "source", value(candidate.getSource()),
                "redNumbers", String.join(" ", candidate.getRedNumbers() == null ? List.of() : candidate.getRedNumbers()),
                "blueNumber", value(candidate.getBlueNumber()),
                "evidenceTag", value(candidate.getEvidenceTag()),
                "driftLabel", value(candidate.getDriftLabel()),
                "redHits", value(candidate.getRedHits()),
                "blueHit", value(candidate.getBlueHit()),
                "prizeName", value(candidate.getPrizeName()),
                "resultState", value(candidate.getResultState()),
                "convertedTicketCount", value(candidate.getConvertedTicketCount()),
                "checkedTicketCount", value(candidate.getCheckedTicketCount()),
                "winningTicketCount", value(candidate.getWinningTicketCount()),
                "totalCost", money(candidate.getTotalCost()),
                "totalPrize", money(candidate.getTotalPrize()),
                "netResult", money(candidate.getNetResult()),
                "warnings", String.join(" | ", candidate.getWarnings() == null ? List.of() : candidate.getWarnings())
        ), provenance);
    }

    private List<Map<String, String>> ticketImportPreviewRows(Map<String, String> filters) {
        return auditRows(filters, "TICKET_IMPORT_PREVIEW").stream()
                .map(event -> row(
                        "id", value(event.getId()),
                        "eventType", value(event.getEventType()),
                        "validCount", filterValue(event, "validCount"),
                        "invalidCount", filterValue(event, "invalidCount"),
                        "duplicateExistingCount", filterValue(event, "duplicateExistingCount"),
                        "duplicateRequestCount", filterValue(event, "duplicateRequestCount"),
                        "rowCount", value(event.getRowCount()),
                        "message", value(event.getMessage()),
                        "generatedAt", value(event.getGeneratedAt())
                ))
                .toList();
    }

    private List<Map<String, String>> budgetPrecheckRows(Map<String, String> filters) {
        return limit(auditEventRepository.findAll(Sort.by(Sort.Direction.DESC, "generatedAt")).stream()
                .filter(event -> "TICKET_BUDGET_PRECHECK".equals(event.getEventType())
                        || "TICKET_BATCH_SAVE".equals(event.getEventType())
                        || event.getFilters() != null && event.getFilters().containsKey("budgetStatus"))
                .filter(event -> !hasText(filters.get("status")) || upper(filters.get("status")).equals(upper(filterValue(event, "budgetStatus"))))
                .map(event -> row(
                        "id", value(event.getId()),
                        "eventType", value(event.getEventType()),
                        "budgetStatus", filterValue(event, "budgetStatus"),
                        "requestedCount", filterValue(event, "requestedCount"),
                        "proposedTicketCount", filterValue(event, "proposedTicketCount"),
                        "proposedCost", filterValue(event, "proposedCost"),
                        "weeklyUsagePercent", filterValue(event, "weeklyUsagePercent"),
                        "monthlyUsagePercent", filterValue(event, "monthlyUsagePercent"),
                        "rowCount", value(event.getRowCount()),
                        "message", value(event.getMessage()),
                        "generatedAt", value(event.getGeneratedAt())
                ))
                .toList(), filters);
    }

    private List<Map<String, String>> settlementReviewRows(Map<String, String> filters) {
        String issue = filters.get("issue");
        return limit(ledgerService.issues().stream()
                .filter(item -> !hasText(issue) || issue.equals(item.getIssue()))
                .map(item -> row(
                        "issue", value(item.getIssue()),
                        "period", value(item.getPeriod()),
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
                .map(item -> appendResearchProvenance(row(
                        "id", value(item.getId()),
                        "decisionSetId", value(item.getDecisionSetId()),
                        "strategyName", value(item.getStrategyName()),
                        "presetWindow", value(item.getPresetWindow()),
                        "issueStart", value(item.getIssueStart()),
                        "issueEnd", value(item.getIssueEnd()),
                        "replayCount", value(item.getReplayCount()),
                        "baselineSeed", value(item.getBaselineSeed()),
                        "baselineAlgorithm", value(item.getBaselineAlgorithm()),
                        "windowIssueCount", value(item.getWindowIssueCount()),
                        "candidateCount", value(item.getCandidateCount()),
                        "uniqueCandidateCount", value(item.getUniqueCandidateCount()),
                        "ticketCount", value(item.getTicketCount()),
                        "baselineTicketCount", value(item.getBaselineTicketCount()),
                        "sameWindow", value(item.getSameWindow()),
                        "sameBudget", value(item.getSameBudget()),
                        "averageRedHits", money(item.getAverageRedHits()),
                        "baselineAverageRedHits", money(item.getBaselineAverageRedHits()),
                        "averageRedHitsDelta", money(item.getAverageRedHitsDelta()),
                        "blueHitRate", money(item.getBlueHitRate()),
                        "baselineBlueHitRate", money(item.getBaselineBlueHitRate()),
                        "blueHitRateDelta", money(item.getBlueHitRateDelta()),
                        "totalCost", money(item.getTotalCost()),
                        "baselineTotalCost", money(item.getBaselineTotalCost()),
                        "totalPrize", money(item.getTotalPrize()),
                        "baselineTotalPrize", money(item.getBaselineTotalPrize()),
                        "totalPrizeDelta", money(item.getTotalPrizeDelta()),
                        "netResult", money(item.getNetResult()),
                        "baselineNetResult", money(item.getBaselineNetResult()),
                        "netResultDelta", money(item.getNetResultDelta()),
                        "roiPercent", money(item.getRoiPercent()),
                        "baselineRoiPercent", money(item.getBaselineRoiPercent()),
                        "roiPercentDelta", money(item.getRoiPercentDelta()),
                        "candidateDiversity", money(item.getCandidateDiversity()),
                        "maxRedOverlap", value(item.getMaxRedOverlap()),
                        "distinctBlueCount", value(item.getDistinctBlueCount()),
                        "evaluationMode", value(item.getEvaluationMode()),
                        "overfitWarnings", String.join(" | ", item.getOverfitWarnings() == null ? List.of() : item.getOverfitWarnings()),
                        "stabilityScore", value(item.getStabilityScore()),
                        "createdAt", value(item.getCreatedAt())
                ), item.getProvenance()))
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
                        "failureCategory", value(log.getFailureCategory()),
                        "provider", value(log.getProvider()),
                        "requestMode", value(log.getRequestMode()),
                        "httpStatus", value(log.getHttpStatus()),
                        "networkBlockSuspected", value(log.getNetworkBlockSuspected()),
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
                        "failureCategory", value(log.getFailureCategory()),
                        "requestMode", value(log.getRequestMode()),
                        "httpStatus", value(log.getHttpStatus()),
                        "responseContentType", value(log.getResponseContentType()),
                        "networkBlockSuspected", value(log.getNetworkBlockSuspected()),
                        "responseSnippet", value(log.getResponseSnippet()),
                        "message", value(log.getMessage()),
                        "checkedAt", value(log.getCheckedAt())
                ))
                .toList(), filters);
    }

    private List<LotteryAuditEvent> auditRows(Map<String, String> filters, String eventType) {
        return limitAudit(auditEventRepository.findAll(Sort.by(Sort.Direction.DESC, "generatedAt")).stream()
                .filter(event -> eventType.equals(event.getEventType()))
                .toList(), filters);
    }

    private List<LotteryAuditEvent> limitAudit(List<LotteryAuditEvent> rows, Map<String, String> filters) {
        int limit = normalizeLimit(parseInt(filters.get("limit")));
        return rows.size() <= limit ? rows : rows.subList(0, limit);
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

    private Map<String, String> appendResearchProvenance(Map<String, String> row,
                                                         LotteryResearchProvenance provenance) {
        row.put("provenanceSourceType", provenance == null ? "" : value(provenance.getSourceType()));
        row.put("generationId", provenance == null ? "" : value(provenance.getGenerationId()));
        row.put("batchId", provenance == null ? "" : value(provenance.getBatchId()));
        row.put("runId", provenance == null ? "" : value(provenance.getRunId()));
        row.put("runName", provenance == null ? "" : value(provenance.getRunName()));
        row.put("corpusVersion", provenance == null ? "" : value(provenance.getCorpusVersion()));
        row.put("trainSha256", provenance == null ? "" : value(provenance.getTrainSha256()));
        row.put("validationSha256", provenance == null ? "" : value(provenance.getValidationSha256()));
        row.put("checkpointSha256", provenance == null ? "" : value(provenance.getCheckpointSha256()));
        row.put("prompt", provenance == null ? "" : value(provenance.getPrompt()));
        row.put("maxNewTokens", provenance == null ? "" : value(provenance.getMaxNewTokens()));
        row.put("temperature", provenance == null ? "" : value(provenance.getTemperature()));
        row.put("topK", provenance == null ? "" : value(provenance.getTopK()));
        row.put("seed", provenance == null ? "" : value(provenance.getSeed()));
        row.put("strategyLabel", provenance == null ? "" : value(provenance.getStrategyLabel()));
        row.put("trainFirstIssue", provenance == null ? "" : value(provenance.getTrainFirstIssue()));
        row.put("trainLatestIssue", provenance == null ? "" : value(provenance.getTrainLatestIssue()));
        row.put("validationFirstIssue", provenance == null ? "" : value(provenance.getValidationFirstIssue()));
        row.put("validationLatestIssue", provenance == null ? "" : value(provenance.getValidationLatestIssue()));
        row.put("batchBaseSeed", provenance == null ? "" : value(provenance.getBatchBaseSeed()));
        row.put("batchMaxRedOverlap", provenance == null ? "" : value(provenance.getBatchMaxRedOverlap()));
        row.put("batchMinimumBlueCoverage", provenance == null ? "" : value(provenance.getBatchMinimumBlueCoverage()));
        row.put("batchMinimumBlueCoverageMet", provenance == null ? "" : value(provenance.getBatchMinimumBlueCoverageMet()));
        row.put("batchStrategies", provenance == null || provenance.getBatchStrategies() == null
                ? ""
                : String.join(" | ", provenance.getBatchStrategies()));
        row.put("modelConfig", provenance == null ? "" : value(provenance.getModelConfig()));
        row.put("provenanceCapturedAt", provenance == null ? "" : value(provenance.getCapturedAt()));
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
        String safe = protectSpreadsheetFormula(value == null ? "" : value);
        if (safe.contains(",") || safe.contains("\"") || safe.contains("\n") || safe.contains("\r")) {
            return "\"" + safe.replace("\"", "\"\"") + "\"";
        }
        return safe;
    }

    private String protectSpreadsheetFormula(String value) {
        if (value.isEmpty()) {
            return value;
        }
        String candidate = value.stripLeading();
        if (candidate.isEmpty()) {
            return value;
        }
        char first = candidate.charAt(0);
        boolean explicitFormula = first == '=' || first == '@';
        boolean signedFormula = (first == '+' || first == '-') && !isNumeric(candidate);
        boolean controlPrefix = value.charAt(0) == '\t' || value.charAt(0) == '\r';
        return explicitFormula || signedFormula || controlPrefix ? "'" + value : value;
    }

    private boolean isNumeric(String value) {
        try {
            new BigDecimal(value);
            return true;
        } catch (NumberFormatException exception) {
            return false;
        }
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

    private Boolean bool(String value) {
        return hasText(value) ? Boolean.parseBoolean(value.trim()) : null;
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

    private String evidenceTag(LotteryRuleEvidence evidence) {
        return evidence == null ? "" : value(evidence.getTag());
    }

    private String reasons(LotteryRuleEvidence evidence) {
        return evidence == null || evidence.getReasons() == null ? "" : String.join(" | ", evidence.getReasons());
    }

    private String filterValue(LotteryAuditEvent event, String key) {
        return event == null || event.getFilters() == null ? "" : value(event.getFilters().get(key));
    }

    private String money(BigDecimal value) {
        return value == null ? "" : value.toPlainString();
    }
}
