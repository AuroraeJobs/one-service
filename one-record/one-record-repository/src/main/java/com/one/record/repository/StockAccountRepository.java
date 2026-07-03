package com.one.record.repository;

import com.one.record.stock.StockAccount;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface StockAccountRepository extends MongoRepository<StockAccount, String> {

    List<StockAccount> findByUserIdOrderByCreatedAtAsc(String userId);

    Optional<StockAccount> findByIdAndUserId(String id, String userId);
}
