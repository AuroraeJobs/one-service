package com.one.record.repository;

import com.one.record.stock.StockKLineSyncLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockKLineSyncLogRepository extends MongoRepository<StockKLineSyncLog, String> {

    List<StockKLineSyncLog> findTop50ByOrderByStartedAtDesc();

    List<StockKLineSyncLog> findTop50BySymbolOrderByStartedAtDesc(String symbol);

    List<StockKLineSyncLog> findTop50ByStatusOrderByStartedAtDesc(String status);

    List<StockKLineSyncLog> findTop50BySymbolAndStatusOrderByStartedAtDesc(String symbol, String status);

    List<StockKLineSyncLog> findByOrderByStartedAtDesc(Pageable pageable);

    List<StockKLineSyncLog> findBySymbolOrderByStartedAtDesc(String symbol, Pageable pageable);
}
