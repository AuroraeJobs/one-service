package com.one.record.repository;

import com.one.record.model.LotteryPredictionRuleRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LotteryPredictionRuleRepository extends MongoRepository<LotteryPredictionRuleRecord, String> {

    List<LotteryPredictionRuleRecord> findByOrderByCreatedAtDesc(Pageable pageable);
}
