package com.one.record.service;

import com.one.record.model.LotteryTicket;
import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryTicketBatchSaveRequest;
import com.one.record.lottery.LotteryTicketBatchSaveResult;
import com.one.record.lottery.LotteryTicketPrizeCheckSummary;
import com.one.record.lottery.LotteryTicketSummary;
import com.one.record.training.LotteryActualRecord;

import java.util.List;

public interface ILotteryTicketService {

    List<LotteryTicket> tickets(String issue, String status, String source, String prizeGrade, String predictionSnapshotId);

    LotteryPageResponse<LotteryTicket> ticketsPage(String issue,
                                                   String status,
                                                   String source,
                                                   String prizeGrade,
                                                   String predictionSnapshotId,
                                                   Long createdStartAt,
                                                   Long createdEndAt,
                                                   Integer page,
                                                   Integer pageSize);

    LotteryTicket saveTicket(LotteryTicket ticket);

    LotteryTicketBatchSaveResult saveTickets(LotteryTicketBatchSaveRequest request);

    LotteryTicket updateTicket(String id, LotteryTicket ticket);

    void deleteTicket(String id);

    List<LotteryTicket> checkPrizes(LotteryActualRecord actualRecord);

    LotteryTicketPrizeCheckSummary checkLatestPrizes();

    LotteryTicketSummary summary();
}
