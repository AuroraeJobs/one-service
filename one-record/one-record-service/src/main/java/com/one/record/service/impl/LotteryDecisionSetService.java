package com.one.record.service.impl;

import com.one.record.lottery.LotteryAuditMetadata;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryDecisionCandidateSelection;
import com.one.record.model.LotteryDecisionSet;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryDecisionSetRepository;
import com.one.record.service.ILotteryDecisionSetService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@AllArgsConstructor
public class LotteryDecisionSetService implements ILotteryDecisionSetService {

    private static final String DEFAULT_USER_ID = "default";

    private static final String REQUESTER_SCOPE = "default";

    private static final int DEFAULT_PAGE = 1;

    private static final int DEFAULT_PAGE_SIZE = 20;

    private static final int MAX_PAGE_SIZE = 100;

    private static final int MAX_CANDIDATES = 100;

    private final LotteryDecisionSetRepository repository;

    private final LotteryAuditEventRepository auditEventRepository;

    @Override
    public LotteryPageResponse<LotteryDecisionSet> decisionSets(Boolean includeArchived, Integer page, Integer pageSize) {
        int currentPage = normalizePage(page);
        int currentPageSize = normalizePageSize(pageSize);
        boolean withArchived = Boolean.TRUE.equals(includeArchived);
        PageRequest pageRequest = PageRequest.of(currentPage - 1, currentPageSize);
        long total = withArchived ? repository.countByUserId(DEFAULT_USER_ID) : repository.countByUserIdAndArchivedFalse(DEFAULT_USER_ID);
        List<LotteryDecisionSet> items = withArchived
                ? repository.findByUserIdOrderByUpdatedAtDesc(DEFAULT_USER_ID, pageRequest)
                : repository.findByUserIdAndArchivedFalseOrderByUpdatedAtDesc(DEFAULT_USER_ID, pageRequest);
        return LotteryPageResponse.<LotteryDecisionSet>builder()
                .items(items)
                .page(currentPage)
                .pageSize(currentPageSize)
                .total(total)
                .hasNext((long) currentPage * currentPageSize < total)
                .build();
    }

    @Override
    public LotteryDecisionSet createDecisionSet(LotteryDecisionSet decisionSet) {
        long now = System.currentTimeMillis();
        LotteryDecisionSet target = new LotteryDecisionSet();
        applyMutableFields(target, decisionSet);
        target.setUserId(DEFAULT_USER_ID);
        target.setStatus("ACTIVE");
        target.setArchived(false);
        target.setArchivedAt(null);
        target.setCreatedAt(now);
        target.setUpdatedAt(now);
        target.setAuditMetadata(audit("decision-set-create", now, now));
        LotteryDecisionSet saved = repository.save(target);
        saveAuditEvent("DECISION_SET_CREATE", saved, "Created lottery decision set");
        return saved;
    }

    @Override
    public LotteryDecisionSet updateDecisionSet(String id, LotteryDecisionSet decisionSet) {
        LotteryDecisionSet target = loadOwnedDecisionSet(id);
        long now = System.currentTimeMillis();
        applyMutableFields(target, decisionSet);
        target.setUpdatedAt(now);
        target.setAuditMetadata(audit("decision-set-update", createdAt(target, now), now));
        LotteryDecisionSet saved = repository.save(target);
        saveAuditEvent("DECISION_SET_UPDATE", saved, "Updated lottery decision set");
        return saved;
    }

    @Override
    public LotteryDecisionSet archiveDecisionSet(String id) {
        LotteryDecisionSet target = loadOwnedDecisionSet(id);
        long now = System.currentTimeMillis();
        target.setStatus("ARCHIVED");
        target.setArchived(true);
        target.setArchivedAt(now);
        target.setUpdatedAt(now);
        target.setAuditMetadata(audit("decision-set-archive", createdAt(target, now), now));
        LotteryDecisionSet saved = repository.save(target);
        saveAuditEvent("DECISION_SET_ARCHIVE", saved, "Archived lottery decision set");
        return saved;
    }

    private LotteryDecisionSet loadOwnedDecisionSet(String id) {
        if (!StringUtils.hasText(id)) {
            throw new IllegalArgumentException("决策集 ID 不能为空");
        }
        return repository.findByIdAndUserId(id, DEFAULT_USER_ID)
                .orElseThrow(() -> new IllegalArgumentException("决策集不存在: " + id));
    }

    private void applyMutableFields(LotteryDecisionSet target, LotteryDecisionSet source) {
        Integer targetPeriod = source == null ? null : source.getTargetPeriod();
        String targetIssue = normalizeText(source == null ? null : source.getTargetIssue());
        if (targetPeriod == null) {
            targetPeriod = parseInteger(targetIssue);
        }
        target.setTargetIssue(targetIssue);
        target.setTargetPeriod(targetPeriod);
        target.setTitle(normalizeTitle(source == null ? null : source.getTitle(), targetPeriod));
        target.setRuleName(normalizeText(source == null ? null : source.getRuleName()));
        target.setEvidenceState(normalizeState(source == null ? null : source.getEvidenceState(), "ALL"));
        target.setResultState(normalizeState(source == null ? null : source.getResultState(), "ALL"));
        target.setConversionState(normalizeState(source == null ? null : source.getConversionState(), "DRAFT"));
        target.setNote(normalizeText(source == null ? null : source.getNote()));
        target.setSelectedCandidates(normalizeCandidates(source == null ? null : source.getSelectedCandidates()));
    }

    private List<LotteryDecisionCandidateSelection> normalizeCandidates(List<LotteryDecisionCandidateSelection> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return new ArrayList<>();
        }
        return candidates.stream()
                .filter(candidate -> candidate != null && (candidate.getRedNumbers() != null || StringUtils.hasText(candidate.getBlueNumber())))
                .limit(MAX_CANDIDATES)
                .map(this::normalizeCandidate)
                .toList();
    }

    private LotteryDecisionCandidateSelection normalizeCandidate(LotteryDecisionCandidateSelection candidate) {
        return LotteryDecisionCandidateSelection.builder()
                .key(normalizeText(candidate.getKey()))
                .snapshotId(normalizeText(candidate.getSnapshotId()))
                .snapshotTitle(normalizeText(candidate.getSnapshotTitle()))
                .candidateTitle(normalizeCandidateTitle(candidate.getCandidateTitle()))
                .source(normalizeState(candidate.getSource(), "CANDIDATE"))
                .targetPeriod(candidate.getTargetPeriod())
                .ruleId(normalizeText(candidate.getRuleId()))
                .ruleName(normalizeText(candidate.getRuleName()))
                .redNumbers(normalizeNumbers(candidate.getRedNumbers()))
                .blueNumber(normalizeText(candidate.getBlueNumber()))
                .score(candidate.getScore())
                .evidence(candidate.getEvidence())
                .replayText(normalizeText(candidate.getReplayText()))
                .driftLabel(normalizeText(candidate.getDriftLabel()))
                .resultLabel(normalizeText(candidate.getResultLabel()))
                .resultState(normalizeState(candidate.getResultState(), "PENDING"))
                .redOverlap(candidate.getRedOverlap())
                .blueOverlap(Boolean.TRUE.equals(candidate.getBlueOverlap()))
                .ticketCount(candidate.getTicketCount() == null || candidate.getTicketCount() < 0 ? 0 : candidate.getTicketCount())
                .ticketState(normalizeText(candidate.getTicketState()))
                .warning(normalizeText(candidate.getWarning()))
                .convertedTicketIds(normalizeIds(candidate.getConvertedTicketIds()))
                .build();
    }

    private List<String> normalizeNumbers(List<String> numbers) {
        if (numbers == null || numbers.isEmpty()) {
            return new ArrayList<>();
        }
        return numbers.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .limit(6)
                .toList();
    }

    private List<String> normalizeIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }
        return ids.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .limit(50)
                .toList();
    }

    private void saveAuditEvent(String eventType, LotteryDecisionSet decisionSet, String message) {
        Map<String, String> filters = new LinkedHashMap<>();
        if (StringUtils.hasText(decisionSet.getTargetIssue())) {
            filters.put("targetIssue", decisionSet.getTargetIssue());
        }
        if (StringUtils.hasText(decisionSet.getRuleName())) {
            filters.put("ruleName", decisionSet.getRuleName());
        }
        filters.put("conversionState", decisionSet.getConversionState());
        auditEventRepository.save(LotteryAuditEvent.builder()
                .eventType(eventType)
                .targetType("decision-set")
                .targetId(decisionSet.getId())
                .requesterScope(REQUESTER_SCOPE)
                .filters(filters)
                .rowCount(decisionSet.getSelectedCandidates() == null ? 0 : decisionSet.getSelectedCandidates().size())
                .message(message)
                .generatedAt(System.currentTimeMillis())
                .build());
    }

    private LotteryAuditMetadata audit(String action, long createdAt, long updatedAt) {
        return LotteryAuditMetadata.builder()
                .action(action)
                .source("decision-set-service")
                .requesterScope(REQUESTER_SCOPE)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();
    }

    private long createdAt(LotteryDecisionSet target, long fallback) {
        return target.getCreatedAt() == null ? fallback : target.getCreatedAt();
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

    private String normalizeTitle(String title, Integer targetPeriod) {
        String normalized = normalizeText(title);
        if (StringUtils.hasText(normalized)) {
            return normalized;
        }
        return targetPeriod == null ? "预测决策集" : "第 " + targetPeriod + " 期决策集";
    }

    private String normalizeCandidateTitle(String title) {
        String normalized = normalizeText(title);
        return StringUtils.hasText(normalized) ? normalized : "候选号码";
    }

    private String normalizeState(String state, String defaultState) {
        return StringUtils.hasText(state) ? state.trim().toUpperCase(Locale.ROOT) : defaultState;
    }

    private String normalizeText(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private Integer parseInteger(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
