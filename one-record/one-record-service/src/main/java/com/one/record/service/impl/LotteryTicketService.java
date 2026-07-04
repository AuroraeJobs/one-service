package com.one.record.service.impl;

import com.one.common.exception.NotFoundException;
import com.one.common.exception.ServiceException;
import com.one.record.lottery.LotteryPrizeResult;
import com.one.record.lottery.LotteryTicketBatchSaveRequest;
import com.one.record.lottery.LotteryTicketBatchSaveResult;
import com.one.record.lottery.LotteryTicketPrizeCheckSummary;
import com.one.record.lottery.LotteryTicketSummary;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.service.ILotteryTicketService;
import com.one.record.service.IRecordService;
import com.one.record.training.LotteryActualRecord;
import com.one.record.util.LotteryDrawUtil;
import com.one.record.util.LotteryPrizeCalculator;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
public class LotteryTicketService implements ILotteryTicketService {

    private static final String DEFAULT_USER_ID = "default";

    private static final String DEFAULT_STATUS = "DRAFT";

    private static final String DEFAULT_SOURCE = "MANUAL";

    private final LotteryTicketRepository repository;

    private final IRecordService recordService;

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
    public LotteryTicket saveTicket(LotteryTicket ticket) {
        if (ticket == null) {
            throw new ServiceException("彩票票据不能为空");
        }
        Long now = System.currentTimeMillis();
        LotteryTicket target = LotteryTicket.builder()
                .userId(DEFAULT_USER_ID)
                .createdAt(now)
                .updatedAt(now)
                .build();
        copyTicket(ticket, target);
        LotteryTicket duplicate = duplicateOf(target);
        if (duplicate != null) {
            return duplicate;
        }
        return repository.save(target);
    }

    @Override
    public LotteryTicketBatchSaveResult saveTickets(LotteryTicketBatchSaveRequest request) {
        List<LotteryTicket> tickets = request == null || request.getTickets() == null ? List.of() : request.getTickets();
        List<LotteryTicket> savedTickets = new ArrayList<>();
        List<LotteryTicket> duplicateTickets = new ArrayList<>();
        for (LotteryTicket ticket : tickets) {
            LotteryTicket normalized = newTicket(ticket);
            LotteryTicket duplicate = duplicateOf(normalized);
            if (duplicate != null || duplicateInBatch(savedTickets, normalized)) {
                duplicateTickets.add(duplicate == null ? normalized : duplicate);
                continue;
            }
            savedTickets.add(repository.save(normalized));
        }
        return LotteryTicketBatchSaveResult.builder()
                .requestedCount(tickets.size())
                .savedCount(savedTickets.size())
                .duplicateCount(duplicateTickets.size())
                .savedTickets(savedTickets)
                .duplicateTickets(duplicateTickets)
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
        return repository.save(target);
    }

    @Override
    public void deleteTicket(String id) {
        LotteryTicket existing = repository.findByIdAndUserId(id, DEFAULT_USER_ID)
                .orElseThrow(() -> new NotFoundException("彩票票据不存在: {}", id));
        repository.deleteById(existing.getId());
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
                .build();
        copyTicket(ticket, target);
        return target;
    }

    private LotteryTicket duplicateOf(LotteryTicket ticket) {
        if (ticket == null || !StringUtils.hasText(ticket.getIssue()) || ticket.getRedNumbers() == null
                || ticket.getRedNumbers().isEmpty() || !StringUtils.hasText(ticket.getBlueNumber())) {
            return null;
        }
        java.util.Optional<LotteryTicket> duplicate = repository.findFirstByUserIdAndIssueAndRedNumbersAndBlueNumber(
                DEFAULT_USER_ID, ticket.getIssue(), ticket.getRedNumbers(), ticket.getBlueNumber());
        return duplicate == null ? null : duplicate.orElse(null);
    }

    private boolean duplicateInBatch(List<LotteryTicket> savedTickets, LotteryTicket ticket) {
        return savedTickets.stream()
                .anyMatch(saved -> sameTicketNumbers(saved, ticket));
    }

    private boolean sameTicketNumbers(LotteryTicket left, LotteryTicket right) {
        return left != null && right != null
                && java.util.Objects.equals(left.getIssue(), right.getIssue())
                && java.util.Objects.equals(left.getRedNumbers(), right.getRedNumbers())
                && java.util.Objects.equals(left.getBlueNumber(), right.getBlueNumber());
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

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String normalizeOptional(String value) {
        return StringUtils.hasText(value) ? value.trim().toUpperCase() : null;
    }
}
