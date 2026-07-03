package com.one.record.service;

import com.one.record.model.LotteryTicket;
import com.one.record.lottery.LotteryTicketSummary;
import com.one.record.training.LotteryActualRecord;

import java.util.List;

public interface ILotteryTicketService {

    List<LotteryTicket> tickets(String issue, String status, String source, String prizeGrade);

    LotteryTicket saveTicket(LotteryTicket ticket);

    LotteryTicket updateTicket(String id, LotteryTicket ticket);

    void deleteTicket(String id);

    List<LotteryTicket> checkPrizes(LotteryActualRecord actualRecord);

    LotteryTicketSummary summary();
}
