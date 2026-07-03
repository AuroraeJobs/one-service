package com.one.record.service.impl;

import com.one.common.exception.NotFoundException;
import com.one.common.exception.ServiceException;
import com.one.record.lottery.LotteryPrizeResult;
import com.one.record.lottery.LotteryTicketSummary;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.service.ILotteryTicketService;
import com.one.record.training.LotteryActualRecord;
import com.one.record.util.LotteryDrawUtil;
import com.one.record.util.LotteryPrizeCalculator;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
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

    @Override
    public List<LotteryTicket> tickets(String issue, String status, String source, String prizeGrade) {
        String safeStatus = normalizeOptional(status);
        String safeSource = normalizeOptional(source);
        String safePrizeGrade = normalizeOptional(prizeGrade);
        List<LotteryTicket> items;
        if (StringUtils.hasText(issue)) {
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
        return repository.save(target);
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
        if (actualRecord == null || actualRecord.getPeriod() <= 0) {
            throw new ServiceException("兑奖开奖期号不能为空");
        }
        List<String> actualRedNumbers = LotteryDrawUtil.normalizeRedNumbers(actualRecord.getRedNumbers());
        String actualBlueNumber = LotteryDrawUtil.normalizeBlueNumber(actualRecord.getBlueNumber());
        List<LotteryTicket> tickets = repository.findByUserIdAndIssueOrderByCreatedAtDesc(
                DEFAULT_USER_ID, String.valueOf(actualRecord.getPeriod()));
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
