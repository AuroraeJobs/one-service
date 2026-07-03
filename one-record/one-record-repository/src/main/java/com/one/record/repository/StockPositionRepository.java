package com.one.record.repository;

import com.one.record.stock.StockPosition;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface StockPositionRepository extends MongoRepository<StockPosition, String> {

    List<StockPosition> findByUserIdOrderBySymbolAscCreatedAtAsc(String userId);

    List<StockPosition> findByUserIdAndAccountIdOrderBySymbolAscCreatedAtAsc(String userId, String accountId);

    Optional<StockPosition> findByIdAndUserId(String id, String userId);
}
