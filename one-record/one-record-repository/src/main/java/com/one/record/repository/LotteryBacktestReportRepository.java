package com.one.record.repository;

import com.one.record.model.LotteryBacktestReport;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface LotteryBacktestReportRepository extends MongoRepository<LotteryBacktestReport, String> {
}
