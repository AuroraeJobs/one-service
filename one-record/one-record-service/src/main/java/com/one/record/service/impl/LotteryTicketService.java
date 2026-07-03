package com.one.record.service.impl;

import com.one.common.exception.NotFoundException;
import com.one.common.exception.ServiceException;
import com.one.record.model.LotteryTicket;
import com.one.record.repository.LotteryTicketRepository;
import com.one.record.service.ILotteryTicketService;
import com.one.record.util.LotteryDrawUtil;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;

@Service
@AllArgsConstructor
public class LotteryTicketService implements ILotteryTicketService {

    private static final String DEFAULT_USER_ID = "default";

    private static final String DEFAULT_STATUS = "DRAFT";

    private static final String DEFAULT_SOURCE = "MANUAL";

    private final LotteryTicketRepository repository;

    @Override
    public List<LotteryTicket> tickets(String issue) {
        if (StringUtils.hasText(issue)) {
            return repository.findByUserIdAndIssueOrderByCreatedAtDesc(DEFAULT_USER_ID, issue.trim());
        }
        return repository.findByUserIdOrderByPeriodDescCreatedAtDesc(DEFAULT_USER_ID);
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
}
