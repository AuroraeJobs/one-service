package com.one.record.service;

import com.one.record.model.LotteryTicket;

import java.util.List;

public interface ILotteryTicketService {

    List<LotteryTicket> tickets(String issue);

    LotteryTicket saveTicket(LotteryTicket ticket);

    LotteryTicket updateTicket(String id, LotteryTicket ticket);

    void deleteTicket(String id);
}
