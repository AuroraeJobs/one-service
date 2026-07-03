package com.one.record.repository;

import com.one.record.stock.StockTrade;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface StockTradeRepository extends MongoRepository<StockTrade, String> {

    List<StockTrade> findByUserIdOrderByTradedAtDescCreatedAtDesc(String userId);

    List<StockTrade> findByUserIdAndAccountIdOrderByTradedAtDescCreatedAtDesc(String userId, String accountId);

    List<StockTrade> findByUserIdAndSymbolOrderByTradedAtDescCreatedAtDesc(String userId, String symbol);

    List<StockTrade> findByUserIdAndAccountIdAndSymbolOrderByTradedAtAscCreatedAtAsc(String userId, String accountId, String symbol);

    List<StockTrade> findByUserIdAndAccountIdIsNullAndSymbolOrderByTradedAtAscCreatedAtAsc(String userId, String symbol);

    Optional<StockTrade> findByIdAndUserId(String id, String userId);
}
