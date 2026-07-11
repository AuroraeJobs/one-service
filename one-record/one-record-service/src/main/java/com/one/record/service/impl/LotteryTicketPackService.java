package com.one.record.service.impl;

import com.one.common.exception.NotFoundException;
import com.one.common.exception.ServiceException;
import com.one.record.lottery.LotteryAuditMetadata;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryResearchProvenance;
import com.one.record.lottery.LotteryTicketBatchSaveRequest;
import com.one.record.lottery.LotteryTicketBatchSaveResult;
import com.one.record.lottery.LotteryTicketBudgetPrecheckRequest;
import com.one.record.lottery.LotteryTicketBudgetPrecheckResult;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryDecisionCandidateSelection;
import com.one.record.model.LotteryDecisionSet;
import com.one.record.model.LotteryTicket;
import com.one.record.model.LotteryTicketPack;
import com.one.record.model.LotteryTicketPackItem;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryDecisionSetRepository;
import com.one.record.repository.LotteryTicketPackRepository;
import com.one.record.service.ILotteryTicketPackService;
import com.one.record.service.ILotteryTicketService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@AllArgsConstructor
public class LotteryTicketPackService implements ILotteryTicketPackService {

    private static final String DEFAULT_USER_ID = "default";

    private static final int DEFAULT_PAGE = 1;

    private static final int DEFAULT_PAGE_SIZE = 20;

    private static final int MAX_PAGE_SIZE = 100;

    private static final BigDecimal DEFAULT_TICKET_COST = new BigDecimal("2.00");

    private final LotteryTicketPackRepository repository;

    private final LotteryDecisionSetRepository decisionSetRepository;

    private final ILotteryTicketService ticketService;

    private final LotteryAuditEventRepository auditEventRepository;

    @Override
    public LotteryPageResponse<LotteryTicketPack> ticketPacks(Boolean includeArchived, Integer page, Integer pageSize) {
        int currentPage = normalizePage(page);
        int currentPageSize = normalizePageSize(pageSize);
        boolean withArchived = Boolean.TRUE.equals(includeArchived);
        PageRequest pageRequest = PageRequest.of(currentPage - 1, currentPageSize);
        long total = withArchived ? repository.countByUserId(DEFAULT_USER_ID) : repository.countByUserIdAndArchivedFalse(DEFAULT_USER_ID);
        List<LotteryTicketPack> items = withArchived
                ? repository.findByUserIdOrderByUpdatedAtDesc(DEFAULT_USER_ID, pageRequest)
                : repository.findByUserIdAndArchivedFalseOrderByUpdatedAtDesc(DEFAULT_USER_ID, pageRequest);
        return LotteryPageResponse.<LotteryTicketPack>builder()
                .items(items)
                .page(currentPage)
                .pageSize(currentPageSize)
                .total(total)
                .hasNext((long) currentPage * currentPageSize < total)
                .build();
    }

    @Override
    public LotteryTicketPack preview(LotteryTicketPack ticketPack) {
        LotteryTicketPack normalized = normalize(ticketPack, false);
        saveAuditEvent("TICKET_PACK_PREVIEW", normalized, "Previewed lottery ticket pack");
        return normalized;
    }

    @Override
    public LotteryTicketPack create(LotteryTicketPack ticketPack) {
        long now = System.currentTimeMillis();
        LotteryTicketPack normalized = normalize(ticketPack, false);
        normalized.setId(UUID.randomUUID().toString());
        normalized.getItems().forEach(item -> item.setTicketPackId(normalized.getId()));
        normalized.setUserId(DEFAULT_USER_ID);
        normalized.setStatus("DRAFT");
        normalized.setApprovalState("PENDING");
        normalized.setArchived(false);
        normalized.setCreatedAt(now);
        normalized.setUpdatedAt(now);
        normalized.setAuditMetadata(audit("ticket-pack-create", now, now));
        LotteryTicketPack saved = repository.save(normalized);
        saveAuditEvent("TICKET_PACK_CREATE", saved, "Created lottery ticket pack");
        return saved;
    }

    @Override
    public LotteryTicketPack approve(String id) {
        LotteryTicketPack target = loadOwned(id);
        requireTargetIssue(target);
        long now = System.currentTimeMillis();
        target.setApprovalState("APPROVED");
        target.setStatus("APPROVED");
        target.setApprovedAt(now);
        target.setUpdatedAt(now);
        target.setBudgetPrecheck(precheck(target.getItems(), target.getTargetIssue()));
        target.setWarnings(warnings(target.getItems(), target.getBudgetPrecheck()));
        target.setAuditMetadata(audit("ticket-pack-approve", createdAt(target, now), now));
        LotteryTicketPack saved = repository.save(target);
        saveAuditEvent("TICKET_PACK_APPROVE", saved, "Approved lottery ticket pack");
        return saved;
    }

    @Override
    public LotteryTicketPack saveAsTickets(String id) {
        LotteryTicketPack target = loadOwned(id);
        if (!"APPROVED".equals(target.getApprovalState())) {
            throw new ServiceException("票包需要先审批通过");
        }
        requireTargetIssue(target);
        List<LotteryTicket> tickets = tickets(
                target.getItems(),
                target.getTargetIssue(),
                target.getId(),
                target.getDecisionSetId(),
                target.getProvenance()
        );
        LotteryTicketBatchSaveResult saveResult = ticketService.saveTickets(LotteryTicketBatchSaveRequest.builder()
                .tickets(tickets)
                .build());
        long now = System.currentTimeMillis();
        target.setStatus("SAVED");
        target.setSavedAt(now);
        target.setUpdatedAt(now);
        target.setBudgetPrecheck(saveResult.getBudgetPrecheck());
        target.setSavedTicketIds(saveResult.getSavedTickets() == null ? List.of() : saveResult.getSavedTickets().stream()
                .map(LotteryTicket::getId)
                .filter(StringUtils::hasText)
                .toList());
        target.setWarnings(warnings(target.getItems(), saveResult.getBudgetPrecheck()));
        target.setAuditMetadata(audit("ticket-pack-save-tickets", createdAt(target, now), now));
        LotteryTicketPack saved = repository.save(target);
        saveAuditEvent("TICKET_PACK_SAVE_TICKETS", saved, "Saved lottery ticket pack as tickets");
        return saved;
    }

    @Override
    public LotteryTicketPack archive(String id) {
        LotteryTicketPack target = loadOwned(id);
        long now = System.currentTimeMillis();
        target.setArchived(true);
        target.setArchivedAt(now);
        target.setStatus("ARCHIVED");
        target.setUpdatedAt(now);
        target.setAuditMetadata(audit("ticket-pack-archive", createdAt(target, now), now));
        LotteryTicketPack saved = repository.save(target);
        saveAuditEvent("TICKET_PACK_ARCHIVE", saved, "Archived lottery ticket pack");
        return saved;
    }

    private LotteryTicketPack normalize(LotteryTicketPack source, boolean persisted) {
        if (source == null) {
            throw new ServiceException("彩票票包不能为空");
        }
        LotteryDecisionSet sourceDecisionSet = sourceDecisionSet(source);
        List<LotteryTicketPackItem> items = normalizeItems(resolveItems(source), source.getTargetIssue());
        String targetIssue = firstText(source.getTargetIssue(), sourceTargetIssue(source));
        LotteryTicketBudgetPrecheckResult budgetPrecheck = precheck(items, targetIssue);
        LotteryTicketPack target = LotteryTicketPack.builder()
                .id(persisted ? source.getId() : null)
                .userId(DEFAULT_USER_ID)
                .title(firstText(source.getTitle(), titleFromSource(source)))
                .targetIssue(targetIssue)
                .sourceType(firstText(source.getSourceType(), "MANUAL"))
                .sourceId(trim(source.getSourceId()))
                .decisionSetId(firstText(source.getDecisionSetId(), sourceDecisionSet == null ? null : sourceDecisionSet.getId()))
                .generationId(firstText(source.getGenerationId(), singleGenerationId(items)))
                .provenance(copyProvenance(source.getProvenance() == null && sourceDecisionSet != null
                        ? sourceDecisionSet.getProvenance()
                        : source.getProvenance()))
                .status(firstText(source.getStatus(), "DRAFT"))
                .approvalState(firstText(source.getApprovalState(), "PENDING"))
                .archived(Boolean.TRUE.equals(source.getArchived()))
                .items(items)
                .budgetPrecheck(budgetPrecheck)
                .warnings(warnings(items, budgetPrecheck))
                .savedTicketIds(source.getSavedTicketIds() == null ? new ArrayList<>() : new ArrayList<>(source.getSavedTicketIds()))
                .createdAt(source.getCreatedAt())
                .updatedAt(source.getUpdatedAt())
                .build();
        if (items.isEmpty()) {
            target.getWarnings().add("暂无可执行票据");
        }
        return target;
    }

    private List<LotteryTicketPackItem> resolveItems(LotteryTicketPack source) {
        if (source.getItems() != null && !source.getItems().isEmpty()) {
            return source.getItems();
        }
        if ("DECISION_SET".equals(source.getSourceType()) && StringUtils.hasText(source.getSourceId())) {
            LotteryDecisionSet decisionSet = sourceDecisionSet(source);
            return (decisionSet.getSelectedCandidates() == null ? List.<LotteryDecisionCandidateSelection>of() : decisionSet.getSelectedCandidates())
                    .stream()
                    .map(candidate -> itemFromDecision(decisionSet, candidate))
                    .toList();
        }
        return List.of();
    }

    private LotteryTicketPackItem itemFromDecision(LotteryDecisionSet decisionSet, LotteryDecisionCandidateSelection candidate) {
        return LotteryTicketPackItem.builder()
                .key(candidate.getKey())
                .candidateKey(candidate.getKey())
                .generationId(candidate.getGenerationId())
                .provenance(copyProvenance(candidate.getProvenance() == null ? decisionSet.getProvenance() : candidate.getProvenance()))
                .title(firstText(candidate.getCandidateTitle(), candidate.getSnapshotTitle(), decisionSet.getTitle()))
                .redNumbers(candidate.getRedNumbers() == null ? List.of() : new ArrayList<>(candidate.getRedNumbers()))
                .blueNumber(candidate.getBlueNumber())
                .quantity(candidate.getTicketCount() == null || candidate.getTicketCount() <= 0 ? 1 : candidate.getTicketCount())
                .cost(DEFAULT_TICKET_COST)
                .source(decisionSet.getProvenance() != null && StringUtils.hasText(decisionSet.getProvenance().getSourceType())
                        ? decisionSet.getProvenance().getSourceType()
                        : "DECISION_SET")
                .predictionSnapshotId(candidate.getSnapshotId())
                .decisionSetId(decisionSet.getId())
                .note(firstText(candidate.getReplayText(), decisionSet.getNote()))
                .warnings(StringUtils.hasText(candidate.getWarning()) ? List.of(candidate.getWarning()) : List.of())
                .build();
    }

    private List<LotteryTicketPackItem> normalizeItems(List<LotteryTicketPackItem> items, String targetIssue) {
        LinkedHashSet<String> seen = new LinkedHashSet<>();
        List<LotteryTicketPackItem> normalized = new ArrayList<>();
        for (LotteryTicketPackItem item : items == null ? List.<LotteryTicketPackItem>of() : items) {
            if (item == null || item.getRedNumbers() == null || item.getRedNumbers().size() != 6 || !StringUtils.hasText(item.getBlueNumber())) {
                continue;
            }
            String key = key(item.getRedNumbers(), item.getBlueNumber());
            List<String> warnings = new ArrayList<>(item.getWarnings() == null ? List.of() : item.getWarnings());
            if (!seen.add(key)) {
                warnings.add("票包内重复号码");
            }
            normalized.add(LotteryTicketPackItem.builder()
                    .key(key)
                    .ticketPackId(trim(item.getTicketPackId()))
                    .decisionSetId(trim(item.getDecisionSetId()))
                    .candidateKey(firstText(item.getCandidateKey(), item.getKey()))
                    .generationId(trim(item.getGenerationId()))
                    .provenance(copyProvenance(item.getProvenance()))
                    .title(firstText(item.getTitle(), "票包候选"))
                    .redNumbers(item.getRedNumbers().stream().filter(StringUtils::hasText).map(String::trim).toList())
                    .blueNumber(item.getBlueNumber().trim())
                    .quantity(item.getQuantity() == null || item.getQuantity() <= 0 ? 1 : item.getQuantity())
                    .cost(item.getCost() == null || item.getCost().compareTo(BigDecimal.ZERO) <= 0 ? DEFAULT_TICKET_COST : item.getCost())
                    .source(firstText(item.getSource(), "TICKET_PACK"))
                    .predictionSnapshotId(trim(item.getPredictionSnapshotId()))
                    .portfolioId(trim(item.getPortfolioId()))
                    .note(firstText(item.getNote(), "票包草稿 " + value(targetIssue)))
                    .warnings(warnings)
                    .build());
        }
        return normalized.stream().limit(100).toList();
    }

    private LotteryTicketBudgetPrecheckResult precheck(List<LotteryTicketPackItem> items, String targetIssue) {
        return ticketService.budgetPrecheck(LotteryTicketBudgetPrecheckRequest.builder()
                .tickets(tickets(items, targetIssue, null, null, null))
                .build());
    }

    private List<LotteryTicket> tickets(List<LotteryTicketPackItem> items,
                                        String targetIssue,
                                        String ticketPackId,
                                        String decisionSetId,
                                        LotteryResearchProvenance packProvenance) {
        return (items == null ? List.<LotteryTicketPackItem>of() : items).stream()
                .filter(Objects::nonNull)
                .map(item -> LotteryTicket.builder()
                        .issue(firstText(targetIssue, null))
                        .redNumbers(item.getRedNumbers() == null ? List.of() : new ArrayList<>(item.getRedNumbers()))
                        .blueNumber(item.getBlueNumber())
                        .quantity(item.getQuantity())
                        .cost(item.getCost())
                        .source(firstText(item.getSource(), "TICKET_PACK"))
                        .status("DRAFT")
                        .predictionSnapshotId(item.getPredictionSnapshotId())
                        .ticketPackId(firstText(item.getTicketPackId(), ticketPackId))
                        .decisionSetId(firstText(item.getDecisionSetId(), decisionSetId))
                        .candidateKey(firstText(item.getCandidateKey(), item.getKey()))
                        .generationId(item.getGenerationId())
                        .provenance(copyProvenance(item.getProvenance() == null ? packProvenance : item.getProvenance()))
                        .note(item.getNote())
                        .build())
                .toList();
    }

    private List<String> warnings(List<LotteryTicketPackItem> items, LotteryTicketBudgetPrecheckResult precheck) {
        LinkedHashSet<String> warnings = new LinkedHashSet<>();
        for (LotteryTicketPackItem item : items == null ? List.<LotteryTicketPackItem>of() : items) {
            if (item.getWarnings() != null) {
                warnings.addAll(item.getWarnings());
            }
        }
        if (precheck != null && !"OK".equals(precheck.getStatus())) {
            warnings.add("预算预检状态：" + precheck.getStatus());
        }
        return new ArrayList<>(warnings);
    }

    private LotteryTicketPack loadOwned(String id) {
        return repository.findByIdAndUserId(id, DEFAULT_USER_ID)
                .orElseThrow(() -> new NotFoundException("彩票票包不存在: {}", id));
    }

    private LotteryDecisionSet sourceDecisionSet(LotteryTicketPack source) {
        if (source == null || !"DECISION_SET".equals(source.getSourceType()) || !StringUtils.hasText(source.getSourceId())) {
            return null;
        }
        return decisionSetRepository.findByIdAndUserId(source.getSourceId().trim(), DEFAULT_USER_ID)
                .orElseThrow(() -> new NotFoundException("彩票决策集不存在: {}", source.getSourceId()));
    }

    private String singleGenerationId(List<LotteryTicketPackItem> items) {
        List<String> generationIds = (items == null ? List.<LotteryTicketPackItem>of() : items).stream()
                .map(LotteryTicketPackItem::getGenerationId)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
        return generationIds.size() == 1 ? generationIds.get(0) : null;
    }

    private void requireTargetIssue(LotteryTicketPack ticketPack) {
        if (ticketPack == null || !StringUtils.hasText(ticketPack.getTargetIssue())) {
            throw new ServiceException("票包目标期号不能为空");
        }
    }

    private void saveAuditEvent(String eventType, LotteryTicketPack ticketPack, String message) {
        Map<String, String> filters = new LinkedHashMap<>();
        filters.put("targetIssue", value(ticketPack.getTargetIssue()));
        filters.put("status", value(ticketPack.getStatus()));
        filters.put("approvalState", value(ticketPack.getApprovalState()));
        filters.put("sourceType", value(ticketPack.getSourceType()));
        filters.put("decisionSetId", value(ticketPack.getDecisionSetId()));
        filters.put("batchId", ticketPack.getProvenance() == null ? "" : value(ticketPack.getProvenance().getBatchId()));
        auditEventRepository.save(LotteryAuditEvent.builder()
                .eventType(eventType)
                .targetType("lottery-ticket-pack")
                .targetId(ticketPack.getId())
                .requesterScope("lottery-ticket-pack")
                .filters(filters)
                .rowCount(ticketPack.getItems() == null ? 0 : ticketPack.getItems().size())
                .message(message)
                .generatedAt(System.currentTimeMillis())
                .build());
    }

    private LotteryAuditMetadata audit(String action, Long createdAt, Long updatedAt) {
        return LotteryAuditMetadata.builder()
                .action(action)
                .source(action)
                .requesterScope(DEFAULT_USER_ID)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();
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

    private Long createdAt(LotteryTicketPack ticketPack, Long fallback) {
        return ticketPack.getCreatedAt() == null ? fallback : ticketPack.getCreatedAt();
    }

    private String titleFromSource(LotteryTicketPack source) {
        if (StringUtils.hasText(source.getTargetIssue())) {
            return source.getTargetIssue().trim() + " 票包草稿";
        }
        return "票包草稿";
    }

    private String sourceTargetIssue(LotteryTicketPack source) {
        if ("DECISION_SET".equals(source.getSourceType()) && StringUtils.hasText(source.getSourceId())) {
            return decisionSetRepository.findByIdAndUserId(source.getSourceId().trim(), DEFAULT_USER_ID)
                    .map(LotteryDecisionSet::getTargetIssue)
                    .orElse(null);
        }
        return null;
    }

    private String key(List<String> redNumbers, String blueNumber) {
        return String.join("-", redNumbers) + "-" + blueNumber;
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private String trim(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String value(String value) {
        return StringUtils.hasText(value) ? value : "";
    }

    private LotteryResearchProvenance copyProvenance(LotteryResearchProvenance source) {
        if (source == null) {
            return null;
        }
        return LotteryResearchProvenance.builder()
                .sourceType(source.getSourceType())
                .generationId(source.getGenerationId())
                .batchId(source.getBatchId())
                .runId(source.getRunId())
                .runName(source.getRunName())
                .corpusVersion(source.getCorpusVersion())
                .trainSha256(source.getTrainSha256())
                .validationSha256(source.getValidationSha256())
                .checkpointSha256(source.getCheckpointSha256())
                .prompt(source.getPrompt())
                .maxNewTokens(source.getMaxNewTokens())
                .temperature(source.getTemperature())
                .topK(source.getTopK())
                .seed(source.getSeed())
                .strategyLabel(source.getStrategyLabel())
                .trainFirstIssue(source.getTrainFirstIssue())
                .trainLatestIssue(source.getTrainLatestIssue())
                .validationFirstIssue(source.getValidationFirstIssue())
                .validationLatestIssue(source.getValidationLatestIssue())
                .batchBaseSeed(source.getBatchBaseSeed())
                .batchMaxRedOverlap(source.getBatchMaxRedOverlap())
                .batchMinimumBlueCoverage(source.getBatchMinimumBlueCoverage())
                .batchMinimumBlueCoverageMet(source.getBatchMinimumBlueCoverageMet())
                .batchStrategies(source.getBatchStrategies() == null ? new ArrayList<>() : new ArrayList<>(source.getBatchStrategies()))
                .modelConfig(source.getModelConfig() == null ? new LinkedHashMap<>() : new LinkedHashMap<>(source.getModelConfig()))
                .capturedAt(source.getCapturedAt())
                .build();
    }
}
