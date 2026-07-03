package com.one.record.repository;

import com.one.record.stock.StockKLine;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockKLineRepository extends MongoRepository<StockKLine, String> {

    Optional<StockKLine> findBySymbolAndPeriodAndTradeDate(String symbol, String period, String tradeDate);

    List<StockKLine> findBySymbolAndPeriodAndTradeDateBetweenOrderByTradeDateAsc(String symbol, String period, String startDate, String endDate);

    List<StockKLine> findTop60BySymbolAndPeriodOrderByTradeDateDesc(String symbol, String period);
}
