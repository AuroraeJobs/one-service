package com.one.record.repository;

import com.one.record.stock.StockAlertHistory;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface StockAlertHistoryRepository extends MongoRepository<StockAlertHistory, String> {

    List<StockAlertHistory> findTop100ByUserIdOrderByTriggeredAtDesc(String userId);

    List<StockAlertHistory> findTop100ByUserIdAndSymbolOrderByTriggeredAtDesc(String userId, String symbol);
}
