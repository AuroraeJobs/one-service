package com.one.record.repository;

import com.one.record.model.LotteryStrategyExperiment;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface LotteryStrategyExperimentRepository extends MongoRepository<LotteryStrategyExperiment, String> {
}
