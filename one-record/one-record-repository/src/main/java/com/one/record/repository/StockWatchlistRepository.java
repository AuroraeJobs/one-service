package com.one.record.repository;

import com.one.record.stock.StockWatchlist;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockWatchlistRepository extends MongoRepository<StockWatchlist, String> {

    Optional<StockWatchlist> findByUserIdAndSymbol(String userId, String symbol);

    boolean existsByUserIdAndSymbol(String userId, String symbol);

    List<StockWatchlist> findByUserIdOrderBySortOrderAscCreatedAtAsc(String userId);

    long countByUserId(String userId);

    void deleteByUserIdAndSymbol(String userId, String symbol);
}
