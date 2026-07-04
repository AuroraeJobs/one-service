package com.one.record.service.impl;

import com.one.common.exception.NotFoundException;
import com.one.record.lottery.LotteryAuditMetadata;
import com.one.record.lottery.LotteryOutcomeAttribution;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryRecommendationStatusRequest;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryRecommendation;
import com.one.record.model.LotteryStrategyNoteEvidence;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryRecommendationRepository;
import com.one.record.service.ILotteryOutcomeAttributionService;
import com.one.record.service.ILotteryRecommendationService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
public class LotteryRecommendationService implements ILotteryRecommendationService {

    private static final String DEFAULT_USER_ID = "default";

    private static final int DEFAULT_PAGE = 1;

    private static final int DEFAULT_PAGE_SIZE = 20;

    private static final int MAX_PAGE_SIZE = 100;

    private final LotteryRecommendationRepository repository;

    private final ILotteryOutcomeAttributionService outcomeService;

    private final LotteryAuditEventRepository auditEventRepository;

    @Override
    public LotteryPageResponse<LotteryRecommendation> recommendations(String recommendationState, Integer page, Integer pageSize) {
        int currentPage = normalizePage(page);
        int currentPageSize = normalizePageSize(pageSize);
        PageRequest pageRequest = PageRequest.of(currentPage - 1, currentPageSize);
        List<LotteryRecommendation> items = StringUtils.hasText(recommendationState)
                ? repository.findByUserIdAndArchivedFalseAndRecommendationStateOrderByUpdatedAtDesc(DEFAULT_USER_ID, recommendationState.trim().toUpperCase(), pageRequest)
                : repository.findByUserIdAndArchivedFalseOrderByUpdatedAtDesc(DEFAULT_USER_ID, pageRequest);
        long total = repository.countByUserIdAndArchivedFalse(DEFAULT_USER_ID);
        return LotteryPageResponse.<LotteryRecommendation>builder()
                .items(items)
                .page(currentPage)
                .pageSize(currentPageSize)
                .total(total)
                .hasNext((long) currentPage * currentPageSize < total)
                .build();
    }

    @Override
    public LotteryRecommendation detail(String id) {
        return loadOwned(id);
    }

    @Override
    public LotteryPageResponse<LotteryRecommendation> refresh(Integer limit) {
        int safeLimit = limit == null || limit <= 0 ? 12 : Math.min(50, limit);
        List<LotteryOutcomeAttribution> outcomes = outcomeService.recent(safeLimit);
        List<LotteryRecommendation> refreshed = new ArrayList<>();
        for (LotteryOutcomeAttribution outcome : outcomes) {
            refreshed.add(upsert(issueRecommendation(outcome)));
            outcome.getDecisionContributions().forEach(decision -> refreshed.add(upsert(ruleRecommendation(outcome, decision))));
            outcome.getPortfolioContributions().forEach(portfolio -> refreshed.add(upsert(portfolioRecommendation(outcome, portfolio))));
            outcome.getSimulationDrifts().forEach(drift -> refreshed.add(upsert(simulationRecommendation(outcome, drift))));
        }
        saveAuditEvent("LOTTERY_RECOMMENDATION_REFRESH", "lottery-recommendations", null, refreshed.size(), Map.of(
                "outcomeCount", String.valueOf(outcomes.size())
        ), "Refreshed lottery recommendations");
        return recommendations(null, 1, Math.max(DEFAULT_PAGE_SIZE, Math.min(MAX_PAGE_SIZE, refreshed.size())));
    }

    @Override
    public LotteryRecommendation updateStatus(String id, LotteryRecommendationStatusRequest request) {
        LotteryRecommendation target = loadOwned(id);
        long now = System.currentTimeMillis();
        String lifecycleStatus = normalizeLifecycleStatus(request == null ? null : request.getLifecycleStatus());
        target.setLifecycleStatus(lifecycleStatus);
        target.setArchived("ARCHIVED".equals(lifecycleStatus));
        target.setArchivedAt("ARCHIVED".equals(lifecycleStatus) ? now : null);
        if (StringUtils.hasText(request == null ? null : request.getNote())) {
            LinkedHashSet<String> reasons = new LinkedHashSet<>(target.getReasons() == null ? List.of() : target.getReasons());
            reasons.add(request.getNote().trim());
            target.setReasons(new ArrayList<>(reasons));
        }
        target.setUpdatedAt(now);
        target.setAuditMetadata(audit("recommendation-status", createdAt(target, now), now));
        LotteryRecommendation saved = repository.save(target);
        saveAuditEvent("LOTTERY_RECOMMENDATION_STATUS", "lottery-recommendation", saved.getId(), 1, Map.of(
                "lifecycleStatus", lifecycleStatus,
                "recommendationState", value(saved.getRecommendationState())
        ), "Updated lottery recommendation status");
        return saved;
    }

    private LotteryRecommendation upsert(LotteryRecommendation recommendation) {
        LotteryRecommendation target = repository.findByUserIdAndTargetTypeAndTargetId(DEFAULT_USER_ID, recommendation.getTargetType(), recommendation.getTargetId())
                .orElseGet(() -> {
                    LotteryRecommendation created = new LotteryRecommendation();
                    created.setUserId(DEFAULT_USER_ID);
                    created.setTargetType(recommendation.getTargetType());
                    created.setTargetId(recommendation.getTargetId());
                    created.setCreatedAt(System.currentTimeMillis());
                    created.setLifecycleStatus("OPEN");
                    created.setArchived(false);
                    return created;
                });
        long now = System.currentTimeMillis();
        target.setTitle(recommendation.getTitle());
        target.setRecommendationState(recommendation.getRecommendationState());
        target.setConfidenceScore(recommendation.getConfidenceScore());
        target.setEvidenceAgeHours(recommendation.getEvidenceAgeHours());
        target.setExpectedAction(recommendation.getExpectedAction());
        target.setEvidenceSummary(recommendation.getEvidenceSummary());
        target.setPath(recommendation.getPath());
        target.setReasons(recommendation.getReasons());
        target.setEvidence(recommendation.getEvidence());
        target.setGeneratedAt(now);
        target.setUpdatedAt(now);
        target.setAuditMetadata(audit("recommendation-refresh", createdAt(target, now), now));
        return repository.save(target);
    }

    private LotteryRecommendation issueRecommendation(LotteryOutcomeAttribution outcome) {
        String state = switch (value(outcome.getCalibrationState())) {
            case "PROMOTE_SIGNAL" -> "PROMOTE";
            case "WATCH_RISK" -> "WATCH";
            case "NO_EXECUTION" -> "WATCH";
            default -> "PAUSE";
        };
        return base("ISSUE", outcome.getIssue(), outcome.getIssue() + " 期归因", state, "/lottery/outcomes?issue=" + outcome.getIssue())
                .confidenceScore(confidence(outcome.getRoiPercent() == null ? 0 : outcome.getRoiPercent().intValue(), outcome.getWinningTicketCount()))
                .expectedAction("PROMOTE".equals(state) ? "沉淀为推荐策略" : "复核归因证据")
                .evidenceSummary("ROI " + outcome.getRoiPercent() + "%，中奖票据 " + outcome.getWinningTicketCount())
                .reasons(List.of("校准状态：" + value(outcome.getCalibrationState())))
                .evidence(List.of(evidence("OUTCOME", "outcome:" + outcome.getIssue(), "归因 " + outcome.getIssue(), outcome.getIssue(), "/lottery/outcomes?issue=" + outcome.getIssue())))
                .build();
    }

    private LotteryRecommendation ruleRecommendation(LotteryOutcomeAttribution outcome, LotteryOutcomeAttribution.DecisionContribution decision) {
        String state = decision.getWinningCandidateCount() != null && decision.getWinningCandidateCount() > 0 ? "PROMOTE" : "WATCH";
        String ruleName = StringUtils.hasText(decision.getRuleName()) ? decision.getRuleName() : "unknown-rule";
        return base("RULE", ruleName, ruleName, state, "/lottery/predictions/decision")
                .confidenceScore(confidence(decision.getRoiPercent() == null ? 0 : decision.getRoiPercent().intValue(), decision.getWinningCandidateCount()))
                .expectedAction("PROMOTE".equals(state) ? "提升规则权重" : "保持观察")
                .evidenceSummary(value(outcome.getIssue()) + " 期决策净收益 " + decision.getNetResult())
                .reasons(List.of("决策贡献：" + value(decision.getContributionState())))
                .evidence(List.of(evidence("DECISION", "decision:" + value(decision.getDecisionSetId()), value(decision.getTitle()), decision.getDecisionSetId(), "/lottery/predictions/decision")))
                .build();
    }

    private LotteryRecommendation portfolioRecommendation(LotteryOutcomeAttribution outcome, LotteryOutcomeAttribution.PortfolioContribution portfolio) {
        String state;
        if ("LINKED".equals(portfolio.getContributionState()) && (portfolio.getWarningCount() == null || portfolio.getWarningCount() == 0)) {
            state = "PROMOTE";
        } else if (portfolio.getWarningCount() != null && portfolio.getWarningCount() >= 3) {
            state = "PAUSE";
        } else {
            state = "WATCH";
        }
        return base("PORTFOLIO", value(portfolio.getPortfolioId()), value(portfolio.getName()), state, "/lottery/strategy-portfolios")
                .confidenceScore(Math.min(100, portfolio.getHealthScore() == null ? 50 : portfolio.getHealthScore()))
                .expectedAction("PROMOTE".equals(state) ? "提高组合分配" : "复核组合证据")
                .evidenceSummary(value(outcome.getIssue()) + " 期关联决策 " + portfolio.getLinkedDecisionCount())
                .reasons(List.of("组合状态：" + value(portfolio.getContributionState())))
                .evidence(List.of(evidence("PORTFOLIO", "portfolio:" + value(portfolio.getPortfolioId()), value(portfolio.getName()), portfolio.getPortfolioId(), "/lottery/strategy-portfolios")))
                .build();
    }

    private LotteryRecommendation simulationRecommendation(LotteryOutcomeAttribution outcome, LotteryOutcomeAttribution.SimulationDrift drift) {
        String state = switch (value(drift.getDriftState())) {
            case "CONFIRMED_SIGNAL" -> "PROMOTE";
            case "RISK_AVOIDED_OR_MISSED" -> "WATCH";
            default -> "PAUSE";
        };
        return base("SIMULATION", value(drift.getAuditId()), "沙盘 " + value(outcome.getIssue()), state, "/lottery/simulator")
                .confidenceScore("PROMOTE".equals(state) ? 82 : 58)
                .evidenceAgeHours(ageHours(drift.getGeneratedAt()))
                .expectedAction("PROMOTE".equals(state) ? "保存沙盘参数" : "调整沙盘权重")
                .evidenceSummary("风险 " + value(drift.getRiskLevel()) + "，中奖票据 " + drift.getActualWinningTicketCount())
                .reasons(List.of("漂移状态：" + value(drift.getDriftState())))
                .evidence(List.of(evidence("SIMULATION", "simulation:" + value(drift.getAuditId()), "沙盘归因 " + value(outcome.getIssue()), drift.getAuditId(), "/lottery/simulator")))
                .build();
    }

    private LotteryRecommendation.LotteryRecommendationBuilder base(String targetType, String targetId, String title, String state, String path) {
        return LotteryRecommendation.builder()
                .targetType(targetType)
                .targetId(targetId)
                .title(title)
                .recommendationState(state)
                .confidenceScore(60)
                .evidenceAgeHours(0)
                .expectedAction("复核")
                .evidenceSummary("")
                .path(path)
                .archived(false);
    }

    private LotteryStrategyNoteEvidence evidence(String type, String key, String title, String sourceId, String path) {
        return LotteryStrategyNoteEvidence.builder()
                .evidenceType(type)
                .evidenceKey(key)
                .title(title)
                .sourceId(sourceId)
                .path(path)
                .attachedAt(System.currentTimeMillis())
                .build();
    }

    private LotteryRecommendation loadOwned(String id) {
        return repository.findByIdAndUserId(id, DEFAULT_USER_ID)
                .orElseThrow(() -> new NotFoundException("彩票推荐不存在: {}", id));
    }

    private void saveAuditEvent(String eventType, String targetType, String targetId, Integer rowCount, Map<String, String> filters, String message) {
        auditEventRepository.save(LotteryAuditEvent.builder()
                .eventType(eventType)
                .targetType(targetType)
                .targetId(targetId)
                .requesterScope("lottery-recommendations")
                .filters(new LinkedHashMap<>(filters))
                .rowCount(rowCount)
                .message(message)
                .generatedAt(System.currentTimeMillis())
                .build());
    }

    private LotteryAuditMetadata audit(String action, Long createdAt, Long updatedAt) {
        return LotteryAuditMetadata.builder()
                .action(action)
                .source("recommendation-service")
                .requesterScope(DEFAULT_USER_ID)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();
    }

    private Integer confidence(Integer roiPercent, Integer winningCount) {
        int score = 50 + Math.min(40, Math.max(0, roiPercent / 10));
        if (winningCount != null && winningCount > 0) {
            score += 10;
        }
        return Math.min(100, score);
    }

    private Integer ageHours(Long timestamp) {
        if (timestamp == null) {
            return 0;
        }
        return (int) Math.max(0, (System.currentTimeMillis() - timestamp) / (60 * 60 * 1000));
    }

    private String normalizeLifecycleStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return "OPEN";
        }
        String normalized = status.trim().toUpperCase();
        return switch (normalized) {
            case "OPEN", "APPLIED", "SNOOZED", "ARCHIVED" -> normalized;
            default -> "OPEN";
        };
    }

    private int normalizePage(Integer page) {
        return page == null || page < 1 ? DEFAULT_PAGE : page;
    }

    private int normalizePageSize(Integer pageSize) {
        if (pageSize == null || pageSize < 1) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(MAX_PAGE_SIZE, pageSize);
    }

    private Long createdAt(LotteryRecommendation recommendation, Long fallback) {
        return recommendation.getCreatedAt() == null ? fallback : recommendation.getCreatedAt();
    }

    private String value(String value) {
        return StringUtils.hasText(value) ? value : "-";
    }
}
