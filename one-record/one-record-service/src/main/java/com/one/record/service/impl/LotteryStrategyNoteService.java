package com.one.record.service.impl;

import com.one.record.lottery.LotteryAuditMetadata;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryStrategyNoteAttachRequest;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryStrategyNote;
import com.one.record.model.LotteryStrategyNoteEvidence;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryStrategyNoteRepository;
import com.one.record.service.ILotteryStrategyNoteService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class LotteryStrategyNoteService implements ILotteryStrategyNoteService {

    private static final String DEFAULT_USER_ID = "default";

    private final LotteryStrategyNoteRepository repository;

    private final LotteryAuditEventRepository auditEventRepository;

    @Override
    public LotteryPageResponse<LotteryStrategyNote> notes(Boolean includeArchived, String status, Integer page, Integer pageSize) {
        int currentPage = page == null || page < 1 ? 1 : page;
        int currentPageSize = pageSize == null || pageSize < 1 ? 20 : Math.min(pageSize, 100);
        PageRequest pageRequest = PageRequest.of(currentPage - 1, currentPageSize);
        boolean includeAll = Boolean.TRUE.equals(includeArchived);
        String normalizedStatus = normalizeStatus(status, null);
        List<LotteryStrategyNote> items;
        long total;
        if (StringUtils.hasText(normalizedStatus) && !includeAll) {
            items = repository.findByUserIdAndStatusAndArchivedFalseOrderByUpdatedAtDesc(DEFAULT_USER_ID, normalizedStatus, pageRequest);
            total = repository.countByUserIdAndStatusAndArchivedFalse(DEFAULT_USER_ID, normalizedStatus);
        } else if (includeAll) {
            items = repository.findByUserIdOrderByUpdatedAtDesc(DEFAULT_USER_ID, pageRequest);
            total = repository.countByUserId(DEFAULT_USER_ID);
        } else {
            items = repository.findByUserIdAndArchivedFalseOrderByUpdatedAtDesc(DEFAULT_USER_ID, pageRequest);
            total = repository.countByUserIdAndArchivedFalse(DEFAULT_USER_ID);
        }
        return LotteryPageResponse.<LotteryStrategyNote>builder()
                .items(items)
                .page(currentPage)
                .pageSize(currentPageSize)
                .total(total)
                .hasNext((long) currentPage * currentPageSize < total)
                .build();
    }

    @Override
    public LotteryStrategyNote create(LotteryStrategyNote note) {
        long now = System.currentTimeMillis();
        LotteryStrategyNote target = normalize(note, new LotteryStrategyNote(), now);
        target.setUserId(DEFAULT_USER_ID);
        target.setArchived(false);
        target.setCreatedAt(now);
        target.setUpdatedAt(now);
        target.setAuditMetadata(audit("strategy-note-create", now, now));
        LotteryStrategyNote saved = repository.save(target);
        saveAudit("STRATEGY_NOTE_CREATE", saved, "Created lottery strategy note");
        return saved;
    }

    @Override
    public LotteryStrategyNote update(String id, LotteryStrategyNote note) {
        LotteryStrategyNote existing = find(id);
        long now = System.currentTimeMillis();
        LotteryStrategyNote target = normalize(note, existing, now);
        target.setId(existing.getId());
        target.setUserId(existing.getUserId());
        target.setArchived(Boolean.TRUE.equals(existing.getArchived()));
        target.setArchivedAt(existing.getArchivedAt());
        target.setCreatedAt(existing.getCreatedAt());
        target.setUpdatedAt(now);
        target.setAuditMetadata(audit("strategy-note-update", existing.getCreatedAt(), now));
        LotteryStrategyNote saved = repository.save(target);
        saveAudit("STRATEGY_NOTE_UPDATE", saved, "Updated lottery strategy note");
        return saved;
    }

    @Override
    public LotteryStrategyNote archive(String id) {
        LotteryStrategyNote existing = find(id);
        long now = System.currentTimeMillis();
        existing.setArchived(true);
        existing.setArchivedAt(now);
        existing.setUpdatedAt(now);
        existing.setAuditMetadata(audit("strategy-note-archive", existing.getCreatedAt(), now));
        LotteryStrategyNote saved = repository.save(existing);
        saveAudit("STRATEGY_NOTE_ARCHIVE", saved, "Archived lottery strategy note");
        return saved;
    }

    @Override
    public LotteryStrategyNote attachEvidence(String id, LotteryStrategyNoteAttachRequest request) {
        LotteryStrategyNote existing = find(id);
        LotteryStrategyNoteEvidence evidence = normalizeEvidence(request == null ? null : request.getEvidence(), System.currentTimeMillis());
        if (!StringUtils.hasText(evidence.getEvidenceKey())) {
            throw new IllegalArgumentException("evidenceKey is required");
        }
        List<LotteryStrategyNoteEvidence> evidenceRows = new ArrayList<>(existing.getEvidence() == null ? List.of() : existing.getEvidence());
        evidenceRows.removeIf(item -> evidence.getEvidenceKey().equals(item.getEvidenceKey()));
        evidenceRows.add(evidence);
        long now = System.currentTimeMillis();
        existing.setEvidence(evidenceRows);
        existing.setUpdatedAt(now);
        existing.setAuditMetadata(audit("strategy-note-attach-evidence", existing.getCreatedAt(), now));
        LotteryStrategyNote saved = repository.save(existing);
        saveAudit("STRATEGY_NOTE_ATTACH_EVIDENCE", saved, "Attached evidence to lottery strategy note");
        return saved;
    }

    private LotteryStrategyNote normalize(LotteryStrategyNote source, LotteryStrategyNote fallback, long now) {
        LotteryStrategyNote input = source == null ? new LotteryStrategyNote() : source;
        fallback.setTitle(trimOrDefault(input.getTitle(), fallback.getTitle(), "策略假设"));
        fallback.setHypothesis(trim(input.getHypothesis()));
        fallback.setExpectedBehavior(trim(input.getExpectedBehavior()));
        fallback.setRuleName(trim(input.getRuleName()));
        fallback.setTargetIssue(trim(input.getTargetIssue()));
        fallback.setStatus(normalizeStatus(input.getStatus(), "DRAFT"));
        fallback.setTags(normalizeTags(input.getTags()));
        fallback.setEvidence((input.getEvidence() == null ? List.<LotteryStrategyNoteEvidence>of() : input.getEvidence())
                .stream()
                .map(item -> normalizeEvidence(item, now))
                .filter(item -> StringUtils.hasText(item.getEvidenceKey()) || StringUtils.hasText(item.getTitle()))
                .collect(Collectors.toCollection(ArrayList::new)));
        return fallback;
    }

    private LotteryStrategyNoteEvidence normalizeEvidence(LotteryStrategyNoteEvidence source, long now) {
        LotteryStrategyNoteEvidence input = source == null ? new LotteryStrategyNoteEvidence() : source;
        return LotteryStrategyNoteEvidence.builder()
                .evidenceKey(trim(input.getEvidenceKey()))
                .evidenceType(normalizeStatus(input.getEvidenceType(), "EVIDENCE"))
                .title(trim(input.getTitle()))
                .sourceId(trim(input.getSourceId()))
                .path(trim(input.getPath()))
                .attachedAt(input.getAttachedAt() == null ? now : input.getAttachedAt())
                .build();
    }

    private LotteryStrategyNote find(String id) {
        return repository.findByIdAndUserId(id, DEFAULT_USER_ID)
                .orElseThrow(() -> new NoSuchElementException("Strategy note not found: " + id));
    }

    private void saveAudit(String eventType, LotteryStrategyNote note, String message) {
        Map<String, String> filters = new LinkedHashMap<>();
        filters.put("status", nullToEmpty(note.getStatus()));
        filters.put("ruleName", nullToEmpty(note.getRuleName()));
        filters.put("targetIssue", nullToEmpty(note.getTargetIssue()));
        filters.put("evidenceCount", String.valueOf(note.getEvidence() == null ? 0 : note.getEvidence().size()));
        auditEventRepository.save(LotteryAuditEvent.builder()
                .eventType(eventType)
                .targetType("strategy-note")
                .targetId(note.getId())
                .requesterScope("lottery-strategy-note")
                .filters(filters)
                .rowCount(1)
                .message(message)
                .generatedAt(System.currentTimeMillis())
                .build());
    }

    private static LotteryAuditMetadata audit(String action, long createdAt, long updatedAt) {
        return LotteryAuditMetadata.builder()
                .action(action)
                .source("strategy-note-service")
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();
    }

    private static List<String> normalizeTags(List<String> tags) {
        return (tags == null ? List.<String>of() : tags).stream()
                .map(LotteryStrategyNoteService::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .limit(8)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private static String normalizeStatus(String value, String fallback) {
        String normalized = trim(value);
        return StringUtils.hasText(normalized) ? normalized.toUpperCase() : fallback;
    }

    private static String trimOrDefault(String value, String fallback, String defaultValue) {
        String trimmed = trim(value);
        if (StringUtils.hasText(trimmed)) {
            return trimmed;
        }
        return StringUtils.hasText(fallback) ? fallback : defaultValue;
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
