package com.one.record.repository;

import com.one.record.stock.StockKLineSyncLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockKLineSyncLogRepository extends MongoRepository<StockKLineSyncLog, String> {

    List<StockKLineSyncLog> findByOrderByStartedAtDesc(Pageable pageable);

    List<StockKLineSyncLog> findBySymbolOrderByStartedAtDesc(String symbol, Pageable pageable);

    List<StockKLineSyncLog> findByStatusOrderByStartedAtDesc(String status, Pageable pageable);

    List<StockKLineSyncLog> findBySymbolAndStatusOrderByStartedAtDesc(String symbol, String status, Pageable pageable);
}
