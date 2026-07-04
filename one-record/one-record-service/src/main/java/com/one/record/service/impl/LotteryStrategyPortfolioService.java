package com.one.record.service.impl;

import com.one.record.lottery.LotteryAuditMetadata;
import com.one.record.lottery.LotteryDecisionOutcomeSummary;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryStrategyPortfolioSummary;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryBacktestReport;
import com.one.record.model.LotteryDecisionSet;
import com.one.record.model.LotteryPredictionRuleRecord;
import com.one.record.model.LotteryStrategyExperiment;
import com.one.record.model.LotteryStrategyNote;
import com.one.record.model.LotteryStrategyPortfolio;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryBacktestReportRepository;
import com.one.record.repository.LotteryDecisionSetRepository;
import com.one.record.repository.LotteryPredictionRuleRepository;
import com.one.record.repository.LotteryStrategyExperimentRepository;
import com.one.record.repository.LotteryStrategyNoteRepository;
import com.one.record.repository.LotteryStrategyPortfolioRepository;
import com.one.record.service.ILotteryDecisionSetService;
import com.one.record.service.ILotteryStrategyPortfolioService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class LotteryStrategyPortfolioService implements ILotteryStrategyPortfolioService {

    private static final String DEFAULT_USER_ID = "default";

    private final LotteryStrategyPortfolioRepository repository;

    private final LotteryPredictionRuleRepository ruleRepository;

    private final LotteryStrategyExperimentRepository experimentRepository;

    private final LotteryBacktestReportRepository backtestRepository;

    private final LotteryDecisionSetRepository decisionSetRepository;

    private final LotteryStrategyNoteRepository noteRepository;

    private final ILotteryDecisionSetService decisionSetService;

    private final LotteryAuditEventRepository auditEventRepository;

    @Override
    public LotteryPageResponse<LotteryStrategyPortfolioSummary> portfolios(Boolean includeArchived, Integer page, Integer pageSize) {
        int currentPage = page == null || page < 1 ? 1 : page;
        int currentPageSize = pageSize == null || pageSize < 1 ? 20 : Math.min(pageSize, 100);
        PageRequest pageRequest = PageRequest.of(currentPage - 1, currentPageSize);
        boolean includeAll = Boolean.TRUE.equals(includeArchived);
        List<LotteryStrategyPortfolio> items = includeAll
                ? repository.findByUserIdOrderByUpdatedAtDesc(DEFAULT_USER_ID, pageRequest)
                : repository.findByUserIdAndArchivedFalseOrderByUpdatedAtDesc(DEFAULT_USER_ID, pageRequest);
        long total = includeAll ? repository.countByUserId(DEFAULT_USER_ID) : repository.countByUserIdAndArchivedFalse(DEFAULT_USER_ID);
        return LotteryPageResponse.<LotteryStrategyPortfolioSummary>builder()
                .items(items.stream().map(this::summaryOf).toList())
                .page(currentPage)
                .pageSize(currentPageSize)
                .total(total)
                .hasNext((long) currentPage * currentPageSize < total)
                .build();
    }

    @Override
    public LotteryStrategyPortfolioSummary detail(String id) {
        return summaryOf(find(id));
    }

    @Override
    public LotteryStrategyPortfolioSummary create(LotteryStrategyPortfolio portfolio) {
        long now = System.currentTimeMillis();
        LotteryStrategyPortfolio target = normalize(portfolio, new LotteryStrategyPortfolio(), now);
        target.setUserId(DEFAULT_USER_ID);
        target.setArchived(false);
        target.setCreatedAt(now);
        target.setUpdatedAt(now);
        target.setAuditMetadata(audit("strategy-portfolio-create", now, now));
        LotteryStrategyPortfolio saved = repository.save(target);
        saveAudit("STRATEGY_PORTFOLIO_CREATE", saved, "Created lottery strategy portfolio");
        return summaryOf(saved);
    }

    @Override
    public LotteryStrategyPortfolioSummary update(String id, LotteryStrategyPortfolio portfolio) {
        LotteryStrategyPortfolio existing = find(id);
        long now = System.currentTimeMillis();
        LotteryStrategyPortfolio target = normalize(portfolio, existing, now);
        target.setId(existing.getId());
        target.setUserId(existing.getUserId());
        target.setCreatedAt(existing.getCreatedAt());
        target.setArchived(Boolean.TRUE.equals(existing.getArchived()));
        target.setArchivedAt(existing.getArchivedAt());
        target.setUpdatedAt(now);
        target.setAuditMetadata(audit("strategy-portfolio-update", existing.getCreatedAt(), now));
        LotteryStrategyPortfolio saved = repository.save(target);
        saveAudit("STRATEGY_PORTFOLIO_UPDATE", saved, "Updated lottery strategy portfolio");
        return summaryOf(saved);
    }

    @Override
    public LotteryStrategyPortfolioSummary archive(String id) {
        LotteryStrategyPortfolio existing = find(id);
        long now = System.currentTimeMillis();
        existing.setArchived(true);
        existing.setArchivedAt(now);
        existing.setUpdatedAt(now);
        existing.setAuditMetadata(audit("strategy-portfolio-archive", existing.getCreatedAt(), now));
        LotteryStrategyPortfolio saved = repository.save(existing);
        saveAudit("STRATEGY_PORTFOLIO_ARCHIVE", saved, "Archived lottery strategy portfolio");
        return summaryOf(saved);
    }

    private LotteryStrategyPortfolioSummary summaryOf(LotteryStrategyPortfolio portfolio) {
        long now = System.currentTimeMillis();
        LotteryDecisionOutcomeSummary outcomeSummary = decisionSetService.outcomeSummary(false, 100);
        List<LotteryStrategyPortfolioSummary.EvidenceSummary> evidence = (portfolio.getEvidence() == null ? List.<LotteryStrategyPortfolio.EvidenceLink>of() : portfolio.getEvidence())
                .stream()
                .map(link -> evidenceSummary(link, outcomeSummary))
                .toList();
        int ruleCount = countType(evidence, "RULE");
        int experimentCount = countType(evidence, "EXPERIMENT");
        int backtestCount = countType(evidence, "BACKTEST");
        int decisionCount = countType(evidence, "DECISION");
        int noteCount = countType(evidence, "NOTE");
        int warnings = evidence.stream().mapToInt(item -> item.getWarningCount() == null ? 0 : item.getWarningCount()).sum();
        int replay = evidence.stream().mapToInt(item -> item.getReplayCount() == null ? 0 : item.getReplayCount()).sum();
        BigDecimal roi = averageRoi(evidence);
        int expectedEvidenceTypes = 5;
        int coveredTypes = (ruleCount > 0 ? 1 : 0) + (experimentCount > 0 ? 1 : 0) + (backtestCount > 0 ? 1 : 0) + (decisionCount > 0 ? 1 : 0) + (noteCount > 0 ? 1 : 0);
        int coverage = Math.round((coveredTypes * 100f) / expectedEvidenceTypes);
        int score = Math.max(0, Math.min(100, 55 + coverage / 3 + replayScore(replay) + roiScore(roi) - warnings * 4));
        return LotteryStrategyPortfolioSummary.builder()
                .portfolio(portfolio)
                .healthScore(score)
                .healthStatus(score >= 85 && warnings == 0 ? "PASS" : score >= 65 ? "WARNING" : "FAILED")
                .roiPercent(roi)
                .warningCount(warnings)
                .replayCount(replay)
                .evidenceCoveragePercent(coverage)
                .ruleCount(ruleCount)
                .experimentCount(experimentCount)
                .backtestCount(backtestCount)
                .decisionCount(decisionCount)
                .noteCount(noteCount)
                .allocationWeight(portfolio.getAllocationWeight())
                .evidence(evidence)
                .generatedAt(now)
                .build();
    }

    private LotteryStrategyPortfolioSummary.EvidenceSummary evidenceSummary(LotteryStrategyPortfolio.EvidenceLink link,
                                                                            LotteryDecisionOutcomeSummary outcomeSummary) {
        String type = normalizeType(link.getEvidenceType());
        return switch (type) {
            case "RULE" -> ruleSummary(link);
            case "EXPERIMENT" -> experimentSummary(link);
            case "BACKTEST" -> backtestSummary(link);
            case "DECISION" -> decisionSummary(link, outcomeSummary);
            case "NOTE" -> noteSummary(link);
            default -> fallbackSummary(link, type);
        };
    }

    private LotteryStrategyPortfolioSummary.EvidenceSummary ruleSummary(LotteryStrategyPortfolio.EvidenceLink link) {
        LotteryPredictionRuleRecord rule = load(link.getSourceId(), ruleRepository::findById);
        return summary(link, "RULE",
                firstText(link.getTitle(), rule == null ? null : rule.getRuleName(), rule == null ? null : rule.getRuleId(), "规则证据"),
                firstText(link.getPath(), "/lottery/research"),
                "ACTIVE",
                null,
                rule == null || rule.getEvidence() == null ? 1 : 0,
                rule == null ? null : rule.getReplayCount(),
                rule == null ? null : rule.getCreatedAt());
    }

    private LotteryStrategyPortfolioSummary.EvidenceSummary experimentSummary(LotteryStrategyPortfolio.EvidenceLink link) {
        LotteryStrategyExperiment experiment = load(link.getSourceId(), experimentRepository::findById);
        return summary(link, "EXPERIMENT",
                firstText(link.getTitle(), experiment == null ? null : experiment.getStrategyName(), "策略实验"),
                firstText(link.getPath(), experiment == null || !StringUtils.hasText(experiment.getId()) ? "/lottery/experiments" : "/lottery/experiments/" + experiment.getId()),
                "ACTIVE",
                null,
                experiment == null ? 1 : 0,
                experiment == null ? null : experiment.getReplayWindow(),
                experiment == null ? null : experiment.getUpdatedAt());
    }

    private LotteryStrategyPortfolioSummary.EvidenceSummary backtestSummary(LotteryStrategyPortfolio.EvidenceLink link) {
        LotteryBacktestReport backtest = load(link.getSourceId(), backtestRepository::findById);
        BigDecimal roi = null;
        if (backtest != null && positive(backtest.getTotalCost())) {
            roi = backtest.getNetResult() == null ? BigDecimal.ZERO : backtest.getNetResult()
                    .divide(backtest.getTotalCost(), 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
                    .setScale(2, RoundingMode.HALF_UP);
        }
        return summary(link, "BACKTEST",
                firstText(link.getTitle(), backtest == null ? null : backtest.getStrategyName(), "回测报告"),
                firstText(link.getPath(), backtest == null || !StringUtils.hasText(backtest.getId()) ? "/lottery/backtests" : "/lottery/backtests/" + backtest.getId()),
                backtest == null ? "MISSING" : safeInt(backtest.getStabilityScore()) >= 70 ? "PASS" : "WARNING",
                roi,
                backtest == null ? 1 : safeInt(backtest.getStabilityScore()) < 70 ? 1 : 0,
                backtest == null ? null : backtest.getReplayCount(),
                backtest == null ? null : backtest.getCreatedAt());
    }

    private LotteryStrategyPortfolioSummary.EvidenceSummary decisionSummary(LotteryStrategyPortfolio.EvidenceLink link,
                                                                            LotteryDecisionOutcomeSummary outcomeSummary) {
        LotteryDecisionSet decision = load(link.getSourceId(), id -> decisionSetRepository.findByIdAndUserId(id, DEFAULT_USER_ID));
        var outcome = outcomeSummary == null || outcomeSummary.getItems() == null ? null : outcomeSummary.getItems().stream()
                .filter(item -> Objects.equals(item.getDecisionSetId(), link.getSourceId()))
                .findFirst()
                .orElse(null);
        return summary(link, "DECISION",
                firstText(link.getTitle(), outcome == null ? null : outcome.getTitle(), decision == null ? null : decision.getTitle(), "保存决策"),
                firstText(link.getPath(), "/lottery/predictions/decision"),
                outcome == null ? "PENDING" : safeInt(outcome.getWarningCount()) > 0 ? "WARNING" : "PASS",
                outcome == null ? null : outcome.getRoiPercent(),
                outcome == null ? 0 : safeInt(outcome.getWarningCount()) + safeInt(outcome.getStaleEvidenceCount()) + safeInt(outcome.getVolatileEvidenceCount()),
                null,
                decision == null ? null : decision.getUpdatedAt());
    }

    private LotteryStrategyPortfolioSummary.EvidenceSummary noteSummary(LotteryStrategyPortfolio.EvidenceLink link) {
        LotteryStrategyNote note = load(link.getSourceId(), id -> noteRepository.findByIdAndUserId(id, DEFAULT_USER_ID));
        int evidenceCount = note == null || note.getEvidence() == null ? 0 : note.getEvidence().size();
        return summary(link, "NOTE",
                firstText(link.getTitle(), note == null ? null : note.getTitle(), "策略笔记"),
                firstText(link.getPath(), "/lottery/research/notebook"),
                note == null ? "MISSING" : evidenceCount > 0 ? "PASS" : "WARNING",
                null,
                note == null || evidenceCount == 0 ? 1 : 0,
                evidenceCount,
                note == null ? null : note.getUpdatedAt());
    }

    private LotteryStrategyPortfolioSummary.EvidenceSummary fallbackSummary(LotteryStrategyPortfolio.EvidenceLink link, String type) {
        return summary(link, type, firstText(link.getTitle(), link.getSourceId(), "组合证据"),
                firstText(link.getPath(), "/lottery/research"), "MANUAL", null, 1, null, link.getAttachedAt());
    }

    private LotteryStrategyPortfolioSummary.EvidenceSummary summary(LotteryStrategyPortfolio.EvidenceLink link,
                                                                    String type,
                                                                    String title,
                                                                    String path,
                                                                    String status,
                                                                    BigDecimal roi,
                                                                    Integer warningCount,
                                                                    Integer replayCount,
                                                                    Long updatedAt) {
        return LotteryStrategyPortfolioSummary.EvidenceSummary.builder()
                .evidenceType(type)
                .sourceId(link.getSourceId())
                .title(title)
                .path(path)
                .allocationWeight(link.getAllocationWeight())
                .status(status)
                .roiPercent(roi)
                .warningCount(warningCount)
                .replayCount(replayCount)
                .updatedAt(updatedAt == null ? link.getAttachedAt() : updatedAt)
                .build();
    }

    private LotteryStrategyPortfolio normalize(LotteryStrategyPortfolio source, LotteryStrategyPortfolio target, long now) {
        LotteryStrategyPortfolio input = source == null ? new LotteryStrategyPortfolio() : source;
        target.setName(firstText(trim(input.getName()), target.getName(), "策略组合"));
        target.setDescription(trim(input.getDescription()));
        target.setStatus(firstText(trim(input.getStatus()), target.getStatus(), "ACTIVE").toUpperCase(Locale.ROOT));
        target.setAllocationWeight(normalizeWeight(input.getAllocationWeight(), BigDecimal.ONE));
        target.setTags(normalizeTags(input.getTags()));
        target.setEvidence((input.getEvidence() == null ? List.<LotteryStrategyPortfolio.EvidenceLink>of() : input.getEvidence()).stream()
                .map(link -> normalizeLink(link, now))
                .filter(link -> StringUtils.hasText(link.getEvidenceType()) || StringUtils.hasText(link.getTitle()))
                .collect(Collectors.toCollection(ArrayList::new)));
        return target;
    }

    private LotteryStrategyPortfolio.EvidenceLink normalizeLink(LotteryStrategyPortfolio.EvidenceLink source, long now) {
        LotteryStrategyPortfolio.EvidenceLink input = source == null ? new LotteryStrategyPortfolio.EvidenceLink() : source;
        return LotteryStrategyPortfolio.EvidenceLink.builder()
                .evidenceType(normalizeType(input.getEvidenceType()))
                .sourceId(trim(input.getSourceId()))
                .title(trim(input.getTitle()))
                .path(trim(input.getPath()))
                .allocationWeight(normalizeWeight(input.getAllocationWeight(), BigDecimal.ONE))
                .note(trim(input.getNote()))
                .attachedAt(input.getAttachedAt() == null ? now : input.getAttachedAt())
                .build();
    }

    private LotteryStrategyPortfolio find(String id) {
        if (!StringUtils.hasText(id)) {
            throw new IllegalArgumentException("Portfolio id is required");
        }
        return repository.findByIdAndUserId(id.trim(), DEFAULT_USER_ID)
                .orElseThrow(() -> new NoSuchElementException("Strategy portfolio not found: " + id));
    }

    private void saveAudit(String eventType, LotteryStrategyPortfolio portfolio, String message) {
        Map<String, String> filters = new LinkedHashMap<>();
        filters.put("status", nullToEmpty(portfolio.getStatus()));
        filters.put("evidenceCount", String.valueOf(portfolio.getEvidence() == null ? 0 : portfolio.getEvidence().size()));
        filters.put("allocationWeight", portfolio.getAllocationWeight() == null ? "" : portfolio.getAllocationWeight().toPlainString());
        auditEventRepository.save(LotteryAuditEvent.builder()
                .eventType(eventType)
                .targetType("strategy-portfolio")
                .targetId(portfolio.getId())
                .requesterScope("lottery-strategy-portfolio")
                .filters(filters)
                .rowCount(1)
                .message(message)
                .generatedAt(System.currentTimeMillis())
                .build());
    }

    private static LotteryAuditMetadata audit(String action, long createdAt, long updatedAt) {
        return LotteryAuditMetadata.builder()
                .action(action)
                .source("strategy-portfolio-service")
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();
    }

    private static int countType(List<LotteryStrategyPortfolioSummary.EvidenceSummary> evidence, String type) {
        return (int) evidence.stream().filter(item -> type.equals(item.getEvidenceType())).count();
    }

    private static BigDecimal averageRoi(List<LotteryStrategyPortfolioSummary.EvidenceSummary> evidence) {
        List<BigDecimal> values = evidence.stream()
                .map(LotteryStrategyPortfolioSummary.EvidenceSummary::getRoiPercent)
                .filter(Objects::nonNull)
                .toList();
        if (values.isEmpty()) {
            return null;
        }
        BigDecimal sum = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(new BigDecimal(values.size()), 2, RoundingMode.HALF_UP);
    }

    private static int replayScore(int replayCount) {
        if (replayCount >= 120) {
            return 12;
        }
        if (replayCount >= 30) {
            return 8;
        }
        return replayCount > 0 ? 4 : 0;
    }

    private static int roiScore(BigDecimal roi) {
        if (roi == null) {
            return 0;
        }
        if (roi.compareTo(BigDecimal.ZERO) >= 0) {
            return 8;
        }
        return -4;
    }

    private static List<String> normalizeTags(List<String> tags) {
        return (tags == null ? List.<String>of() : tags).stream()
                .map(LotteryStrategyPortfolioService::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .limit(12)
                .toList();
    }

    private static BigDecimal normalizeWeight(BigDecimal value, BigDecimal fallback) {
        BigDecimal target = value == null ? fallback : value;
        if (target.compareTo(BigDecimal.ZERO) < 0) {
            target = BigDecimal.ZERO;
        }
        return target.setScale(2, RoundingMode.HALF_UP);
    }

    private static String normalizeType(String value) {
        return StringUtils.hasText(value) ? value.trim().toUpperCase(Locale.ROOT) : "EVIDENCE";
    }

    private static String firstText(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return "";
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }

    private static boolean positive(BigDecimal value) {
        return value != null && value.compareTo(BigDecimal.ZERO) > 0;
    }

    private static int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static <T> T load(String id, java.util.function.Function<String, java.util.Optional<T>> loader) {
        if (!StringUtils.hasText(id)) {
            return null;
        }
        return loader.apply(id.trim()).orElse(null);
    }
}
