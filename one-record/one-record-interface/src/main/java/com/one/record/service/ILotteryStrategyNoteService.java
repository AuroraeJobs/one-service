package com.one.record.service;

import com.one.record.lottery.LotteryPageResponse;
import com.one.record.lottery.LotteryStrategyNoteAttachRequest;
import com.one.record.model.LotteryStrategyNote;

public interface ILotteryStrategyNoteService {

    LotteryPageResponse<LotteryStrategyNote> notes(Boolean includeArchived, String status, Integer page, Integer pageSize);

    LotteryStrategyNote create(LotteryStrategyNote note);

    LotteryStrategyNote update(String id, LotteryStrategyNote note);

    LotteryStrategyNote archive(String id);

    LotteryStrategyNote attachEvidence(String id, LotteryStrategyNoteAttachRequest request);
}
