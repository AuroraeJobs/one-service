package com.one.record.service;

import com.one.record.lottery.LotteryPageResponse;
import com.one.record.model.LotteryTicketPack;

public interface ILotteryTicketPackService {

    LotteryPageResponse<LotteryTicketPack> ticketPacks(Boolean includeArchived, Integer page, Integer pageSize);

    LotteryTicketPack preview(LotteryTicketPack ticketPack);

    LotteryTicketPack create(LotteryTicketPack ticketPack);

    LotteryTicketPack approve(String id);

    LotteryTicketPack saveAsTickets(String id);

    LotteryTicketPack archive(String id);
}
