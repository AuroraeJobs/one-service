package com.one.record.service.impl;

import com.one.record.lottery.LotteryLedgerSummary;
import com.one.record.lottery.LotteryPrizeResult;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.service.ILotteryLedgerService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@AllArgsConstructor
public class LotteryLedgerService implements ILotteryLedgerService {

    private static final String DEFAULT_USER_ID = "default";

    private final LotteryTicketRepository ticketRepository;

    @Override
    public LotteryLedgerSummary summary() {
        List<LotteryTicket> tickets = ticketRepository.findByUserIdOrderByPeriodDescCreatedAtDesc(DEFAULT_USER_ID);
        int checkedCount = 0;
        int winningCount = 0;
        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalPrize = BigDecimal.ZERO;
        for (LotteryTicket ticket : tickets) {
            totalCost = totalCost.add(ticket.getCost() == null ? BigDecimal.ZERO : ticket.getCost());
            LotteryPrizeResult result = ticket.getPrizeResult();
            if (result != null) {
                checkedCount += 1;
                totalPrize = totalPrize.add(prizeAmount(result));
                if (Boolean.TRUE.equals(result.getWinning())) {
                    winningCount += 1;
                }
            }
        }
        BigDecimal netResult = totalPrize.subtract(totalCost);
        return LotteryLedgerSummary.builder()
                .ticketCount(tickets.size())
                .checkedTicketCount(checkedCount)
                .pendingTicketCount(tickets.size() - checkedCount)
                .winningTicketCount(winningCount)
                .totalCost(totalCost)
                .totalPrize(totalPrize)
                .netResult(netResult)
                .roiPercent(roiPercent(netResult, totalCost))
                .generatedAt(System.currentTimeMillis())
                .build();
    }

    private BigDecimal prizeAmount(LotteryPrizeResult result) {
        if (result.getPrizeAmount() == null) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(result.getPrizeAmount()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal roiPercent(BigDecimal netResult, BigDecimal totalCost) {
        if (totalCost.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return netResult.multiply(BigDecimal.valueOf(100)).divide(totalCost, 2, RoundingMode.HALF_UP);
    }
}
