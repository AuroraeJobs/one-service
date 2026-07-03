package com.one.record.repository;

import com.one.record.stock.StockAlertRule;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface StockAlertRuleRepository extends MongoRepository<StockAlertRule, String> {

    List<StockAlertRule> findByUserIdOrderByCreatedAtDesc(String userId);

    List<StockAlertRule> findByUserIdAndEnabledOrderByCreatedAtDesc(String userId, Boolean enabled);

    Optional<StockAlertRule> findByIdAndUserId(String id, String userId);
}
