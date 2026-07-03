package com.one.record.service;

import com.one.record.lottery.LotteryDraw;
import com.one.record.request.RecordRequest;
import com.one.record.response.Record;
import com.one.record.response.RecordYearCount;

import java.util.List;

public interface IRecordService {

    void saveAll(List<Record> item);

    Record findFirst();

    Record findLast();

    Record findById(String id);

    List<Record> findAll();

    List<Record> find(RecordRequest request);

    LotteryDraw findFirstDraw();

    LotteryDraw findLastDraw();

    List<LotteryDraw> findDraws(RecordRequest request, int page, int size);

    List<RecordYearCount> countByYear();

    List<RecordYearCount> getYearCounts();
}
