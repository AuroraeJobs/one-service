package com.one.record.repository;

import com.one.record.model.LotteryBacktestReport;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface LotteryBacktestReportRepository extends MongoRepository<LotteryBacktestReport, String> {

    Optional<LotteryBacktestReport> findFirstByDecisionSetIdOrderByCreatedAtDesc(String decisionSetId);
}
