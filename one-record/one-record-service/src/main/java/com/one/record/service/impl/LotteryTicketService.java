package com.one.record.service.impl;

import com.one.common.exception.NotFoundException;
import com.one.common.exception.ServiceException;
import com.one.record.lottery.LotteryAuditMetadata;
import com.one.record.lottery.LotteryBudgetStatus;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryPrizeResult;
import com.one.record.lottery.LotteryResearchProvenance;
import com.one.record.lottery.LotteryTicketBudgetPrecheckRequest;
import com.one.record.lottery.LotteryTicketBudgetPrecheckResult;
import com.one.record.lottery.LotteryTicketBatchSaveRequest;
import com.one.record.lottery.LotteryTicketBatchSaveResult;
import com.one.record.lottery.LotteryTicketBulkOperationResult;
import com.one.record.lottery.LotteryTicketBulkPatchRequest;
import com.one.record.lottery.LotteryTicketImportPreviewRequest;
import com.one.record.lottery.LotteryTicketImportPreviewResult;
import com.one.record.lottery.LotteryTicketImportPreviewRow;
import com.one.record.lottery.LotteryTicketPrizeCheckSummary;
import com.one.record.lottery.LotteryTicketSummary;
import com.one.record.model.LotteryAuditEvent;
import com.one.record.model.LotteryPreference;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryAuditEventRepository;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.service.ILotteryTicketService;
import com.one.record.service.ILotteryPreferenceService;
import com.one.record.service.IRecordService;
import com.one.record.training.LotteryActualRecord;
import com.one.record.util.LotteryDrawUtil;
import com.one.record.util.LotteryPrizeCalculator;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.MatchResult;
import java.util.regex.Pattern;

@Service
@AllArgsConstructor
public class LotteryTicketService implements ILotteryTicketService {

    private static final String DEFAULT_USER_ID = "default";

    private static final String DEFAULT_STATUS = "DRAFT";

    private static final String DEFAULT_SOURCE = "MANUAL";

    private static final int MAX_IMPORT_LINES = 300;

    private static final Pattern NUMBER_PATTERN = Pattern.compile("\\d+");

    private final LotteryTicketRepository repository;

    private final IRecordService recordService;

    private final ILotteryPreferenceService preferenceService;

    private final LotteryAuditEventRepository auditEventRepository;

    @Override
    public List<LotteryTicket> tickets(String issue, String status, String source, String prizeGrade, String predictionSnapshotId) {
        String safeStatus = normalizeOptional(status);
        String safeSource = normalizeOptional(source);
        String safePrizeGrade = normalizeOptional(prizeGrade);
        List<LotteryTicket> items;
        if (StringUtils.hasText(predictionSnapshotId)) {
            items = repository.findByUserIdAndPredictionSnapshotIdOrderByCreatedAtDesc(DEFAULT_USER_ID, predictionSnapshotId.trim());
        } else if (StringUtils.hasText(issue)) {
            items = repository.findByUserIdAndIssueOrderByCreatedAtDesc(DEFAULT_USER_ID, issue.trim());
        } else {
            items = repository.findByUserIdOrderByPeriodDescCreatedAtDesc(DEFAULT_USER_ID);
        }
        return items.stream()
                .filter(ticket -> safeStatus == null || safeStatus.equals(normalizeOptional(ticket.getStatus())))
                .filter(ticket -> safeSource == null || safeSource.equals(normalizeOptional(ticket.getSource())))
                .filter(ticket -> safePrizeGrade == null || safePrizeGrade.equals(normalizeOptional(ticket.getPrizeGrade())))
                .toList();
    }

    @Override
    public LotteryPageResponse<LotteryTicket> ticketsPage(String issue,
                                                         String status,
                                                         String source,
                                                         String prizeGrade,
                                                         String predictionSnapshotId,
                                                         Long createdStartAt,
                                                         Long createdEndAt,
                                                         Integer page,
                                                         Integer pageSize) {
        int safePage = normalizePage(page);
        int safePageSize = normalizePageSize(pageSize);
        List<LotteryTicket> filtered = tickets(issue, status, source, prizeGrade, predictionSnapshotId)
                .stream()
                .filter(ticket -> createdStartAt == null || ticket.getCreatedAt() != null && ticket.getCreatedAt() >= createdStartAt)
                .filter(ticket -> createdEndAt == null || ticket.getCreatedAt() != null && ticket.getCreatedAt() <= createdEndAt)
                .toList();
        int total = filtered.size();
        int from = Math.min(safePage * safePageSize, total);
        int to = Math.min(from + safePageSize, total);
        return LotteryPageResponse.<LotteryTicket>builder()
                .items(filtered.subList(from, to))
                .page(safePage)
                .pageSize(safePageSize)
                .total((long) total)
                .hasNext(to < total)
                .build();
    }

    @Override
    public LotteryTicket saveTicket(LotteryTicket ticket) {
        if (ticket == null) {
            throw new ServiceException("彩票票据不能为空");
        }
        Long now = System.currentTimeMillis();
        LotteryTicket target = LotteryTicket.builder()
                .userId(DEFAULT_USER_ID)
                .createdAt(now)
                .updatedAt(now)
                .auditMetadata(audit("ticket-save", "ticket-service", now, now))
                .build();
        copyTicket(ticket, target);
        LotteryTicket duplicate = duplicateOf(target);
        if (duplicate != null) {
            return duplicate;
        }
        return repository.save(target);
    }

    @Override
    public LotteryTicketImportPreviewResult importPreview(LotteryTicketImportPreviewRequest request) {
        List<String> lines = importLines(request == null ? null : request.getContent());
        Set<String> seenKeys = new LinkedHashSet<>();
        List<LotteryTicketImportPreviewRow> rows = new ArrayList<>();
        for (int index = 0; index < lines.size(); index++) {
            rows.add(previewImportLine(request, lines.get(index), index + 1, seenKeys));
        }
        List<LotteryTicket> validTickets = rows.stream()
                .filter(row -> "VALID".equals(row.getStatus()))
                .map(LotteryTicketImportPreviewRow::getTicket)
                .filter(Objects::nonNull)
                .toList();
        LotteryTicketBudgetPrecheckResult budgetPrecheck = budgetPrecheckInternal(validTickets, rows.size());
        saveAuditEvent("TICKET_IMPORT_PREVIEW", "tickets-import", null, rows.size(), Map.of(
                "validCount", String.valueOf(validTickets.size()),
                "invalidCount", String.valueOf(countRows(rows, "INVALID")),
                "duplicateExistingCount", String.valueOf(countRows(rows, "DUPLICATE_EXISTING")),
                "duplicateRequestCount", String.valueOf(countRows(rows, "DUPLICATE_REQUEST"))
        ), "Previewed lottery ticket import");
        return LotteryTicketImportPreviewResult.builder()
                .requestedCount(rows.size())
                .validCount(validTickets.size())
                .invalidCount(countRows(rows, "INVALID"))
                .duplicateExistingCount(countRows(rows, "DUPLICATE_EXISTING"))
                .duplicateRequestCount(countRows(rows, "DUPLICATE_REQUEST"))
                .rows(rows)
                .budgetPrecheck(budgetPrecheck)
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    @Override
    public LotteryTicketBudgetPrecheckResult budgetPrecheck(LotteryTicketBudgetPrecheckRequest request) {
        List<LotteryTicket> tickets = request == null || request.getTickets() == null ? List.of() : request.getTickets();
        List<LotteryTicket> normalized = tickets.stream()
                .map(this::newTicket)
                .toList();
        LotteryTicketBudgetPrecheckResult result = budgetPrecheckInternal(normalized, tickets.size());
        saveAuditEvent("TICKET_BUDGET_PRECHECK", "tickets-budget", null, normalized.size(), Map.of(
                "requestedCount", String.valueOf(tickets.size()),
                "proposedTicketCount", String.valueOf(result.getProposedTicketCount()),
                "proposedCost", String.valueOf(result.getProposedCost()),
                "weeklyUsagePercent", String.valueOf(result.getWeeklyUsagePercent()),
                "monthlyUsagePercent", String.valueOf(result.getMonthlyUsagePercent()),
                "budgetStatus", result.getStatus()
        ), "Prechecked lottery ticket budget");
        return result;
    }

    @Override
    public LotteryTicketBatchSaveResult saveTickets(LotteryTicketBatchSaveRequest request) {
        List<LotteryTicket> tickets = request == null || request.getTickets() == null ? List.of() : request.getTickets();
        List<LotteryTicket> ticketsToSave = new ArrayList<>();
        List<LotteryTicket> savedTickets = new ArrayList<>();
        List<LotteryTicket> duplicateTickets = new ArrayList<>();
        for (LotteryTicket ticket : tickets) {
            LotteryTicket normalized = newTicket(ticket);
            LotteryTicket duplicate = duplicateOf(normalized);
            if (duplicate != null || duplicateInBatch(ticketsToSave, normalized)) {
                duplicateTickets.add(duplicate == null ? normalized : duplicate);
                continue;
            }
            ticketsToSave.add(normalized);
        }
        LotteryTicketBudgetPrecheckResult budgetPrecheck = budgetPrecheckInternal(ticketsToSave, tickets.size());
        for (LotteryTicket ticket : ticketsToSave) {
            savedTickets.add(repository.save(ticket));
        }
        saveAuditEvent("TICKET_BATCH_SAVE", "tickets", null, savedTickets.size(), Map.of(
                "requestedCount", String.valueOf(tickets.size()),
                "duplicateCount", String.valueOf(duplicateTickets.size()),
                "budgetStatus", budgetPrecheck.getStatus()
        ), "Saved lottery tickets batch");
        return LotteryTicketBatchSaveResult.builder()
                .requestedCount(tickets.size())
                .savedCount(savedTickets.size())
                .duplicateCount(duplicateTickets.size())
                .savedTickets(savedTickets)
                .duplicateTickets(duplicateTickets)
                .budgetPrecheck(budgetPrecheck)
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    @Override
    public LotteryTicket updateTicket(String id, LotteryTicket ticket) {
        if (ticket == null) {
            throw new ServiceException("彩票票据不能为空");
        }
        LotteryTicket target = repository.findByIdAndUserId(id, DEFAULT_USER_ID)
                .orElseThrow(() -> new NotFoundException("彩票票据不存在: {}", id));
        copyTicket(ticket, target);
        target.setUpdatedAt(System.currentTimeMillis());
        target.setAuditMetadata(updateAudit(target.getAuditMetadata(), "ticket-update", target.getUpdatedAt()));
        return repository.save(target);
    }

    @Override
    public LotteryTicketBulkOperationResult bulkUpdateTickets(LotteryTicketBulkPatchRequest request) {
        List<String> ids = normalizeIds(request == null ? null : request.getIds());
        if (ids.isEmpty()) {
            return emptyBulkResult(0);
        }
        List<String> missingIds = new ArrayList<>();
        List<LotteryTicket> updated = new ArrayList<>();
        Long now = System.currentTimeMillis();
        for (String id : ids) {
            LotteryTicket ticket = repository.findByIdAndUserId(id, DEFAULT_USER_ID).orElse(null);
            if (ticket == null) {
                missingIds.add(id);
                continue;
            }
            applyPatch(ticket, request, now, "ticket-bulk-update");
            updated.add(ticket);
        }
        List<LotteryTicket> saved = updated.isEmpty() ? List.of() : repository.saveAll(updated);
        saveAuditEvent("TICKET_BULK_UPDATE", "tickets", null, saved.size(), Map.of(
                "requestedCount", String.valueOf(ids.size()),
                "missingCount", String.valueOf(missingIds.size())
        ), "Bulk updated lottery tickets");
        return LotteryTicketBulkOperationResult.builder()
                .requestedCount(ids.size())
                .updatedCount(saved.size())
                .archivedCount(0)
                .deletedCount(0)
                .missingIds(missingIds)
                .tickets(saved)
                .generatedAt(now)
                .build();
    }

    @Override
    public LotteryTicketBulkOperationResult archiveTickets(LotteryTicketBulkPatchRequest request) {
        List<String> ids = normalizeIds(request == null ? null : request.getIds());
        if (ids.isEmpty()) {
            return emptyBulkResult(0);
        }
        List<String> missingIds = new ArrayList<>();
        List<LotteryTicket> archived = new ArrayList<>();
        Long now = System.currentTimeMillis();
        for (String id : ids) {
            LotteryTicket ticket = repository.findByIdAndUserId(id, DEFAULT_USER_ID).orElse(null);
            if (ticket == null) {
                missingIds.add(id);
                continue;
            }
            ticket.setStatus("VOID");
            ticket.setUpdatedAt(now);
            ticket.setAuditMetadata(updateAudit(ticket.getAuditMetadata(), "ticket-bulk-archive", now));
            archived.add(ticket);
        }
        List<LotteryTicket> saved = archived.isEmpty() ? List.of() : repository.saveAll(archived);
        saveAuditEvent("TICKET_BULK_ARCHIVE", "tickets", null, saved.size(), Map.of(
                "requestedCount", String.valueOf(ids.size()),
                "missingCount", String.valueOf(missingIds.size())
        ), "Archived lottery tickets");
        return LotteryTicketBulkOperationResult.builder()
                .requestedCount(ids.size())
                .updatedCount(saved.size())
                .archivedCount(saved.size())
                .deletedCount(0)
                .missingIds(missingIds)
                .tickets(saved)
                .generatedAt(now)
                .build();
    }

    @Override
    public void deleteTicket(String id) {
        LotteryTicket existing = repository.findByIdAndUserId(id, DEFAULT_USER_ID)
                .orElseThrow(() -> new NotFoundException("彩票票据不存在: {}", id));
        repository.deleteById(existing.getId());
        saveAuditEvent("TICKET_DELETE", "tickets", existing.getId(), 1, Map.of(
                "issue", value(existing.getIssue())
        ), "Deleted lottery ticket");
    }

    @Override
    public LotteryTicketBulkOperationResult deleteTickets(LotteryTicketBulkPatchRequest request) {
        List<String> ids = normalizeIds(request == null ? null : request.getIds());
        if (ids.isEmpty()) {
            return emptyBulkResult(0);
        }
        List<String> missingIds = new ArrayList<>();
        List<LotteryTicket> deleted = new ArrayList<>();
        for (String id : ids) {
            LotteryTicket ticket = repository.findByIdAndUserId(id, DEFAULT_USER_ID).orElse(null);
            if (ticket == null) {
                missingIds.add(id);
                continue;
            }
            deleted.add(ticket);
        }
        if (!deleted.isEmpty()) {
            repository.deleteAll(deleted);
        }
        saveAuditEvent("TICKET_BULK_DELETE", "tickets", null, deleted.size(), Map.of(
                "requestedCount", String.valueOf(ids.size()),
                "missingCount", String.valueOf(missingIds.size())
        ), "Bulk deleted lottery tickets");
        return LotteryTicketBulkOperationResult.builder()
                .requestedCount(ids.size())
                .updatedCount(0)
                .archivedCount(0)
                .deletedCount(deleted.size())
                .missingIds(missingIds)
                .tickets(List.of())
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    @Override
    public List<LotteryTicket> checkPrizes(LotteryActualRecord actualRecord) {
        return checkPrizes(actualRecord, false);
    }

    private List<LotteryTicket> checkPrizes(LotteryActualRecord actualRecord, boolean pendingOnly) {
        if (actualRecord == null || actualRecord.getPeriod() <= 0) {
            throw new ServiceException("兑奖开奖期号不能为空");
        }
        List<String> actualRedNumbers = LotteryDrawUtil.normalizeRedNumbers(actualRecord.getRedNumbers());
        String actualBlueNumber = LotteryDrawUtil.normalizeBlueNumber(actualRecord.getBlueNumber());
        List<LotteryTicket> tickets = repository.findByUserIdAndIssueOrderByCreatedAtDesc(
                DEFAULT_USER_ID, String.valueOf(actualRecord.getPeriod()));
        if (pendingOnly) {
            tickets = tickets.stream()
                    .filter(ticket -> !"CHECKED".equals(normalizeOptional(ticket.getStatus())))
                    .toList();
        }
        Long now = System.currentTimeMillis();
        for (LotteryTicket ticket : tickets) {
            LotteryPrizeResult result = LotteryPrizeCalculator.calculate(
                    ticket.getRedNumbers(), ticket.getBlueNumber(), actualRedNumbers, actualBlueNumber);
            ticket.setPrizeResult(result);
            ticket.setPrizeGrade(result.getPrizeGrade());
            ticket.setStatus("CHECKED");
            ticket.setUpdatedAt(now);
            ticket.setAuditMetadata(updateAudit(ticket.getAuditMetadata(), "ticket-prize-check", now));
        }
        return repository.saveAll(tickets);
    }

    @Override
    public LotteryTicketPrizeCheckSummary checkLatestPrizes() {
        com.one.record.response.Record latest = recordService.findLast();
        if (latest == null || !StringUtils.hasText(latest.getCode())) {
            throw new ServiceException("暂无最新开奖记录，无法核奖");
        }
        LotteryActualRecord actualRecord = new LotteryActualRecord();
        actualRecord.setPeriod((int) Long.parseLong(latest.getCode()));
        actualRecord.setRedNumbers(LotteryDrawUtil.normalizeRedNumbers(latest.getRed()));
        actualRecord.setBlueNumber(LotteryDrawUtil.normalizeBlueNumber(latest.getBlue()));
        List<LotteryTicket> checked = checkPrizes(actualRecord, true).stream()
                .filter(ticket -> ticket.getPrizeResult() != null)
                .toList();
        long totalPrizeAmount = checked.stream()
                .map(LotteryTicket::getPrizeResult)
                .map(LotteryPrizeResult::getPrizeAmount)
                .filter(amount -> amount != null)
                .mapToLong(Long::longValue)
                .sum();
        int winningCount = (int) checked.stream()
                .filter(ticket -> Boolean.TRUE.equals(ticket.getPrizeResult().getWinning()))
                .count();
        return LotteryTicketPrizeCheckSummary.builder()
                .issue(latest.getCode())
                .checkedTicketCount(checked.size())
                .winningTicketCount(winningCount)
                .totalPrizeAmount(totalPrizeAmount)
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    @Override
    public LotteryTicketSummary summary() {
        List<LotteryTicket> tickets = repository.findByUserIdOrderByPeriodDescCreatedAtDesc(DEFAULT_USER_ID);
        int checkedCount = 0;
        int winningCount = 0;
        BigDecimal totalCost = BigDecimal.ZERO;
        long totalPrizeAmount = 0L;
        Map<String, Integer> statusDistribution = new LinkedHashMap<>();
        Map<String, Integer> prizeDistribution = new LinkedHashMap<>();
        for (LotteryTicket ticket : tickets) {
            totalCost = totalCost.add(ticket.getCost() == null ? BigDecimal.ZERO : ticket.getCost());
            String status = StringUtils.hasText(ticket.getStatus()) ? ticket.getStatus() : "UNKNOWN";
            statusDistribution.put(status, statusDistribution.getOrDefault(status, 0) + 1);
            LotteryPrizeResult result = ticket.getPrizeResult();
            if (result != null) {
                checkedCount += 1;
                String prizeGrade = StringUtils.hasText(result.getPrizeGrade()) ? result.getPrizeGrade() : "UNKNOWN";
                prizeDistribution.put(prizeGrade, prizeDistribution.getOrDefault(prizeGrade, 0) + 1);
                if (Boolean.TRUE.equals(result.getWinning())) {
                    winningCount += 1;
                }
                totalPrizeAmount += result.getPrizeAmount() == null ? 0L : result.getPrizeAmount();
            }
        }
        return LotteryTicketSummary.builder()
                .ticketCount(tickets.size())
                .checkedTicketCount(checkedCount)
                .pendingTicketCount(tickets.size() - checkedCount)
                .winningTicketCount(winningCount)
                .totalCost(totalCost)
                .totalPrizeAmount(totalPrizeAmount)
                .statusDistribution(statusDistribution)
                .prizeDistribution(prizeDistribution)
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    private List<String> importLines(String content) {
        if (!StringUtils.hasText(content)) {
            return List.of();
        }
        return content.lines()
                .map(String::trim)
                .filter(StringUtils::hasText)
                .limit(MAX_IMPORT_LINES)
                .toList();
    }

    private LotteryTicketImportPreviewRow previewImportLine(LotteryTicketImportPreviewRequest request,
                                                            String line,
                                                            int lineNumber,
                                                            Set<String> seenKeys) {
        List<String> tokens = NUMBER_PATTERN.matcher(line)
                .results()
                .map(MatchResult::group)
                .toList();
        String issue = trimToNull(request == null ? null : request.getDefaultIssue());
        List<String> numberTokens = tokens;
        if (tokens.size() >= 8 && tokens.get(0).length() >= 5) {
            issue = tokens.get(0);
            numberTokens = tokens.subList(1, tokens.size());
        } else if (tokens.size() >= 9 && tokens.get(0).length() == 4 && tokens.get(1).length() <= 3) {
            issue = tokens.get(0) + String.format("%03d", Integer.parseInt(tokens.get(1)));
            numberTokens = tokens.subList(2, tokens.size());
        }

        List<String> messages = new ArrayList<>();
        boolean invalid = false;
        if (!StringUtils.hasText(issue)) {
            messages.add("缺少期号，可先在页面筛选期号或每行带期号");
            invalid = true;
        }
        if (numberTokens.size() < 7) {
            messages.add("需要 6 个红球和 1 个蓝球");
            invalid = true;
        }
        if (numberTokens.size() > 7) {
            messages.add("已忽略第 7 个之后的额外号码");
        }

        List<String> redNumbers = List.of();
        String blueNumber = null;
        if (numberTokens.size() >= 6) {
            try {
                redNumbers = LotteryDrawUtil.normalizeRedNumbers(numberTokens.subList(0, 6));
            } catch (IllegalArgumentException exception) {
                messages.add(exception.getMessage());
                invalid = true;
            }
        }
        if (numberTokens.size() >= 7) {
            try {
                blueNumber = LotteryDrawUtil.normalizeBlueNumber(numberTokens.get(6));
            } catch (IllegalArgumentException exception) {
                messages.add(exception.getMessage());
                invalid = true;
            }
        }

        LotteryTicket ticket = null;
        String duplicateGroupKey = null;
        String duplicateTicketId = null;
        String status = invalid ? "INVALID" : "VALID";
        if (!invalid) {
            ticket = importPreviewTicket(request, issue, redNumbers, blueNumber);
            duplicateGroupKey = duplicateKey(ticket);
            LotteryTicket duplicate = duplicateOf(ticket);
            if (duplicate != null) {
                status = "DUPLICATE_EXISTING";
                duplicateTicketId = duplicate.getId();
                messages.add("已有相同票据");
            } else if (seenKeys.contains(duplicateGroupKey)) {
                status = "DUPLICATE_REQUEST";
                messages.add("本次导入内重复");
            } else {
                seenKeys.add(duplicateGroupKey);
            }
        }

        return LotteryTicketImportPreviewRow.builder()
                .key(lineNumber + "-" + line)
                .lineNumber(lineNumber)
                .raw(line)
                .issue(issue)
                .redNumbers(redNumbers)
                .blueNumber(blueNumber)
                .status(status)
                .messages(messages)
                .duplicateGroupKey(duplicateGroupKey)
                .duplicateTicketId(duplicateTicketId)
                .ticket(ticket)
                .build();
    }

    private LotteryTicket importPreviewTicket(LotteryTicketImportPreviewRequest request,
                                              String issue,
                                              List<String> redNumbers,
                                              String blueNumber) {
        LotteryTicket source = LotteryTicket.builder()
                .issue(issue)
                .redNumbers(redNumbers)
                .blueNumber(blueNumber)
                .quantity(request == null || request.getDefaultQuantity() == null ? 1 : request.getDefaultQuantity())
                .cost(request == null ? null : request.getDefaultCost())
                .source(request == null ? null : request.getDefaultSource())
                .status(request == null ? null : request.getDefaultStatus())
                .note(StringUtils.hasText(request == null ? null : request.getNote()) ? request.getNote().trim() : "批量导入")
                .build();
        LotteryTicket target = LotteryTicket.builder()
                .userId(DEFAULT_USER_ID)
                .build();
        copyTicket(source, target);
        return target;
    }

    private int countRows(List<LotteryTicketImportPreviewRow> rows, String status) {
        return (int) rows.stream()
                .filter(row -> status.equals(row.getStatus()))
                .count();
    }

    private LotteryTicketBudgetPrecheckResult budgetPrecheckInternal(List<LotteryTicket> proposedTickets, int requestedCount) {
        Long now = System.currentTimeMillis();
        LotteryPreference preference = preferenceService.preference();
        List<LotteryTicket> existingTickets = repository.findByUserIdOrderByPeriodDescCreatedAtDesc(DEFAULT_USER_ID);
        long weekStart = startOfWeek(now);
        long monthStart = startOfMonth(now);
        BigDecimal weeklyCost = costSince(existingTickets, weekStart);
        BigDecimal monthlyCost = costSince(existingTickets, monthStart);
        BigDecimal proposedCost = proposedTickets.stream()
                .map(this::cost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal projectedWeeklyCost = weeklyCost.add(proposedCost);
        BigDecimal projectedMonthlyCost = monthlyCost.add(proposedCost);
        List<LotteryTicketBudgetPrecheckResult.IssueExposure> issueExposures = issueExposures(existingTickets, proposedTickets);
        List<LotteryBudgetStatus.Warning> warnings = new ArrayList<>();
        addBudgetWarning(warnings, "weekly-budget", "保存后本周投入接近或超过预算", projectedWeeklyCost, preference.getWeeklyBudget(), preference.getBudgetReminderPercent(), "/lottery/ledger");
        addBudgetWarning(warnings, "monthly-budget", "保存后本月投入接近或超过预算", projectedMonthlyCost, preference.getMonthlyBudget(), preference.getBudgetReminderPercent(), "/lottery/ledger");
        Integer maxTickets = preference.getMaxTicketsPerIssue();
        if (maxTickets != null && maxTickets > 0) {
            issueExposures.stream()
                    .filter(exposure -> exposure.getProjectedTicketCount() != null && exposure.getProjectedTicketCount() > maxTickets)
                    .forEach(exposure -> warnings.add(LotteryBudgetStatus.Warning.builder()
                            .key("max-tickets-per-issue")
                            .level("OVER")
                            .message("第 " + exposure.getIssue() + " 期保存后票据数量超过上限 " + maxTickets)
                            .path("/lottery/tickets?issue=" + exposure.getIssue())
                            .build()));
        }
        return LotteryTicketBudgetPrecheckResult.builder()
                .requestedCount(requestedCount)
                .proposedTicketCount(proposedTickets.size())
                .proposedCost(proposedCost)
                .weeklyBudget(preference.getWeeklyBudget())
                .monthlyBudget(preference.getMonthlyBudget())
                .maxTicketsPerIssue(preference.getMaxTicketsPerIssue())
                .budgetReminderPercent(preference.getBudgetReminderPercent())
                .weeklyCost(weeklyCost)
                .monthlyCost(monthlyCost)
                .projectedWeeklyCost(projectedWeeklyCost)
                .projectedMonthlyCost(projectedMonthlyCost)
                .weeklyUsagePercent(percent(projectedWeeklyCost, preference.getWeeklyBudget()))
                .monthlyUsagePercent(percent(projectedMonthlyCost, preference.getMonthlyBudget()))
                .status(warnings.isEmpty() ? "OK" : warnings.stream().anyMatch(warning -> "OVER".equals(warning.getLevel())) ? "OVER" : "WARNING")
                .issueExposures(issueExposures)
                .warnings(warnings)
                .generatedAt(now)
                .build();
    }

    private List<LotteryTicketBudgetPrecheckResult.IssueExposure> issueExposures(List<LotteryTicket> existingTickets,
                                                                                 List<LotteryTicket> proposedTickets) {
        Map<String, Integer> currentCounts = new LinkedHashMap<>();
        for (LotteryTicket ticket : existingTickets) {
            currentCounts.put(issueKey(ticket), currentCounts.getOrDefault(issueKey(ticket), 0) + safeQuantity(ticket));
        }
        Map<String, LotteryTicketBudgetPrecheckResult.IssueExposure> exposures = new LinkedHashMap<>();
        for (LotteryTicket ticket : proposedTickets) {
            String issue = issueKey(ticket);
            LotteryTicketBudgetPrecheckResult.IssueExposure current = exposures.get(issue);
            if (current == null) {
                current = LotteryTicketBudgetPrecheckResult.IssueExposure.builder()
                        .issue(issue)
                        .currentTicketCount(currentCounts.getOrDefault(issue, 0))
                        .proposedTicketCount(0)
                        .projectedTicketCount(currentCounts.getOrDefault(issue, 0))
                        .proposedCost(BigDecimal.ZERO)
                        .build();
            }
            int proposedQuantity = safeQuantity(ticket);
            current.setProposedTicketCount(current.getProposedTicketCount() + proposedQuantity);
            current.setProjectedTicketCount(current.getProjectedTicketCount() + proposedQuantity);
            current.setProposedCost(current.getProposedCost().add(cost(ticket)));
            exposures.put(issue, current);
        }
        return new ArrayList<>(exposures.values());
    }

    private void addBudgetWarning(List<LotteryBudgetStatus.Warning> warnings,
                                  String key,
                                  String message,
                                  BigDecimal cost,
                                  BigDecimal budget,
                                  Integer thresholdPercent,
                                  String path) {
        if (budget == null || budget.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        BigDecimal usage = percent(cost, budget);
        int threshold = thresholdPercent == null ? 80 : thresholdPercent;
        if (usage.compareTo(BigDecimal.valueOf(threshold)) >= 0) {
            warnings.add(LotteryBudgetStatus.Warning.builder()
                    .key(key)
                    .level(usage.compareTo(BigDecimal.valueOf(100)) >= 0 ? "OVER" : "WARNING")
                    .message(message + "（" + usage + "%）")
                    .path(path)
                    .build());
        }
    }

    private void applyPatch(LotteryTicket ticket, LotteryTicketBulkPatchRequest request, long now, String action) {
        if (StringUtils.hasText(request.getIssue())) {
            ticket.setIssue(request.getIssue().trim());
            ticket.setPeriod(parsePeriod(ticket.getIssue()));
        }
        if (request.getQuantity() != null) {
            ticket.setQuantity(request.getQuantity() <= 0 ? 1 : request.getQuantity());
        }
        if (request.getCost() != null) {
            ticket.setCost(request.getCost().compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : request.getCost());
        }
        if (StringUtils.hasText(request.getStatus())) {
            ticket.setStatus(request.getStatus().trim().toUpperCase(Locale.ROOT));
        }
        if (StringUtils.hasText(request.getSource())) {
            ticket.setSource(request.getSource().trim().toUpperCase(Locale.ROOT));
        }
        if (Boolean.TRUE.equals(request.getClearNote())) {
            ticket.setNote(null);
        } else if (StringUtils.hasText(request.getNote())) {
            ticket.setNote(request.getNote().trim());
        }
        ticket.setUpdatedAt(now);
        ticket.setAuditMetadata(updateAudit(ticket.getAuditMetadata(), action, now));
    }

    private List<String> normalizeIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return ids.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .toList();
    }

    private LotteryTicketBulkOperationResult emptyBulkResult(int requestedCount) {
        return LotteryTicketBulkOperationResult.builder()
                .requestedCount(requestedCount)
                .updatedCount(0)
                .archivedCount(0)
                .deletedCount(0)
                .missingIds(List.of())
                .tickets(List.of())
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    private void copyTicket(LotteryTicket source, LotteryTicket target) {
        target.setIssue(trimToNull(source.getIssue()));
        target.setPeriod(resolvePeriod(source));
        target.setRedNumbers(LotteryDrawUtil.normalizeRedNumbers(source.getRedNumbers()));
        target.setBlueNumber(LotteryDrawUtil.normalizeBlueNumber(source.getBlueNumber()));
        target.setQuantity(source.getQuantity() == null || source.getQuantity() <= 0 ? 1 : source.getQuantity());
        target.setCost(source.getCost() == null ? BigDecimal.valueOf(target.getQuantity() * 2L) : source.getCost());
        target.setSource(StringUtils.hasText(source.getSource()) ? source.getSource().trim().toUpperCase() : DEFAULT_SOURCE);
        target.setStatus(StringUtils.hasText(source.getStatus()) ? source.getStatus().trim().toUpperCase() : DEFAULT_STATUS);
        target.setPrizeGrade(trimToNull(source.getPrizeGrade()));
        target.setPrizeResult(source.getPrizeResult());
        target.setPredictionSnapshotId(trimToNull(source.getPredictionSnapshotId()));
        if (StringUtils.hasText(source.getTicketPackId())) {
            target.setTicketPackId(source.getTicketPackId().trim());
        }
        if (StringUtils.hasText(source.getDecisionSetId())) {
            target.setDecisionSetId(source.getDecisionSetId().trim());
        }
        if (StringUtils.hasText(source.getCandidateKey())) {
            target.setCandidateKey(source.getCandidateKey().trim());
        }
        if (StringUtils.hasText(source.getGenerationId())) {
            target.setGenerationId(source.getGenerationId().trim());
        }
        if (source.getProvenance() != null) {
            target.setProvenance(copyProvenance(source.getProvenance()));
        }
        target.setNote(trimToNull(source.getNote()));
    }

    private LotteryTicket newTicket(LotteryTicket ticket) {
        if (ticket == null) {
            throw new ServiceException("彩票票据不能为空");
        }
        Long now = System.currentTimeMillis();
        LotteryTicket target = LotteryTicket.builder()
                .userId(DEFAULT_USER_ID)
                .createdAt(now)
                .updatedAt(now)
                .auditMetadata(audit("ticket-batch-save", "ticket-service", now, now))
                .build();
        copyTicket(ticket, target);
        return target;
    }

    private LotteryTicket duplicateOf(LotteryTicket ticket) {
        if (ticket == null || !StringUtils.hasText(ticket.getIssue()) || ticket.getRedNumbers() == null
                || ticket.getRedNumbers().isEmpty() || !StringUtils.hasText(ticket.getBlueNumber())) {
            return null;
        }
        if (hasResearchLineage(ticket)) {
            List<LotteryTicket> duplicates = repository.findByUserIdAndIssueAndRedNumbersAndBlueNumber(
                    DEFAULT_USER_ID, ticket.getIssue(), ticket.getRedNumbers(), ticket.getBlueNumber());
            return (duplicates == null ? List.<LotteryTicket>of() : duplicates).stream()
                    .filter(existing -> sameResearchLineage(existing, ticket))
                    .findFirst()
                    .orElse(null);
        }
        java.util.Optional<LotteryTicket> duplicate = repository.findFirstByUserIdAndIssueAndRedNumbersAndBlueNumber(
                DEFAULT_USER_ID, ticket.getIssue(), ticket.getRedNumbers(), ticket.getBlueNumber());
        return duplicate == null ? null : duplicate.orElse(null);
    }

    private boolean duplicateInBatch(List<LotteryTicket> savedTickets, LotteryTicket ticket) {
        return savedTickets.stream()
                .anyMatch(saved -> sameTicketNumbers(saved, ticket)
                        && (!hasResearchLineage(ticket) || sameResearchLineage(saved, ticket)));
    }

    private boolean sameTicketNumbers(LotteryTicket left, LotteryTicket right) {
        return left != null && right != null
                && java.util.Objects.equals(left.getIssue(), right.getIssue())
                && java.util.Objects.equals(left.getRedNumbers(), right.getRedNumbers())
                && java.util.Objects.equals(left.getBlueNumber(), right.getBlueNumber());
    }

    private boolean hasResearchLineage(LotteryTicket ticket) {
        return ticket != null && (StringUtils.hasText(ticket.getDecisionSetId())
                || StringUtils.hasText(ticket.getGenerationId())
                || ticket.getProvenance() != null);
    }

    private boolean sameResearchLineage(LotteryTicket left, LotteryTicket right) {
        if (!hasResearchLineage(left) || !hasResearchLineage(right)) {
            return false;
        }
        return java.util.Objects.equals(lineageValue(left.getTicketPackId()), lineageValue(right.getTicketPackId()))
                && java.util.Objects.equals(lineageValue(left.getDecisionSetId()), lineageValue(right.getDecisionSetId()))
                && java.util.Objects.equals(lineageValue(left.getCandidateKey()), lineageValue(right.getCandidateKey()))
                && java.util.Objects.equals(generationLineage(left), generationLineage(right));
    }

    private String generationLineage(LotteryTicket ticket) {
        if (ticket == null) {
            return null;
        }
        if (StringUtils.hasText(ticket.getGenerationId())) {
            return ticket.getGenerationId().trim();
        }
        return ticket.getProvenance() == null ? null : lineageValue(ticket.getProvenance().getGenerationId());
    }

    private String lineageValue(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private BigDecimal costSince(List<LotteryTicket> tickets, long startAt) {
        return tickets.stream()
                .filter(ticket -> timestamp(ticket) >= startAt)
                .map(this::cost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal cost(LotteryTicket ticket) {
        return ticket.getCost() == null ? BigDecimal.ZERO : ticket.getCost();
    }

    private int safeQuantity(LotteryTicket ticket) {
        Integer quantity = ticket.getQuantity();
        return quantity == null || quantity <= 0 ? 1 : quantity;
    }

    private long timestamp(LotteryTicket ticket) {
        Long timestamp = ticket.getCreatedAt() == null ? ticket.getUpdatedAt() : ticket.getCreatedAt();
        return timestamp == null ? System.currentTimeMillis() : timestamp;
    }

    private long startOfWeek(long now) {
        LocalDate today = Instant.ofEpochMilli(now).atZone(ZoneId.systemDefault()).toLocalDate();
        return today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli();
    }

    private long startOfMonth(long now) {
        LocalDate today = Instant.ofEpochMilli(now).atZone(ZoneId.systemDefault()).toLocalDate();
        return today.withDayOfMonth(1)
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli();
    }

    private BigDecimal percent(BigDecimal value, BigDecimal base) {
        if (base == null || base.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return value.multiply(BigDecimal.valueOf(100)).divide(base, 2, RoundingMode.HALF_UP);
    }

    private String issueKey(LotteryTicket ticket) {
        if (StringUtils.hasText(ticket.getIssue())) {
            return ticket.getIssue().trim();
        }
        return ticket.getPeriod() == null ? "UNKNOWN" : String.valueOf(ticket.getPeriod());
    }

    private String duplicateKey(LotteryTicket ticket) {
        if (ticket == null || !StringUtils.hasText(ticket.getIssue()) || ticket.getRedNumbers() == null || ticket.getRedNumbers().isEmpty()
                || !StringUtils.hasText(ticket.getBlueNumber())) {
            return null;
        }
        return ticket.getIssue() + "|" + String.join(",", ticket.getRedNumbers()) + "|" + ticket.getBlueNumber();
    }

    private Long resolvePeriod(LotteryTicket ticket) {
        if (ticket.getPeriod() != null && ticket.getPeriod() > 0) {
            return ticket.getPeriod();
        }
        if (!StringUtils.hasText(ticket.getIssue())) {
            return null;
        }
        try {
            return Long.parseLong(ticket.getIssue().trim());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private Long parsePeriod(String issue) {
        if (!StringUtils.hasText(issue)) {
            return null;
        }
        try {
            return Long.parseLong(issue.trim());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String normalizeOptional(String value) {
        return StringUtils.hasText(value) ? value.trim().toUpperCase() : null;
    }

    private int normalizePage(Integer page) {
        if (page == null || page < 0) {
            return 0;
        }
        return page;
    }

    private int normalizePageSize(Integer pageSize) {
        if (pageSize == null || pageSize <= 0) {
            return 20;
        }
        return Math.min(pageSize, 200);
    }

    private LotteryAuditMetadata audit(String action, String source, long createdAt, long updatedAt) {
        return LotteryAuditMetadata.builder()
                .action(action)
                .source(source)
                .requesterScope(DEFAULT_USER_ID)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();
    }

    private LotteryAuditMetadata updateAudit(LotteryAuditMetadata existing, String action, long updatedAt) {
        if (existing == null) {
            return audit(action, "ticket-service", updatedAt, updatedAt);
        }
        existing.setAction(action);
        existing.setSource("ticket-service");
        existing.setRequesterScope(DEFAULT_USER_ID);
        existing.setUpdatedAt(updatedAt);
        return existing;
    }

    private void saveAuditEvent(String eventType,
                                String targetType,
                                String targetId,
                                Integer rowCount,
                                Map<String, String> filters,
                                String message) {
        auditEventRepository.save(LotteryAuditEvent.builder()
                .eventType(eventType)
                .targetType(targetType)
                .targetId(targetId)
                .requesterScope(DEFAULT_USER_ID)
                .filters(filters == null ? new LinkedHashMap<>() : filters)
                .rowCount(rowCount)
                .message(message)
                .generatedAt(System.currentTimeMillis())
                .build());
    }

    private String value(String value) {
        return value == null ? "" : value;
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
