package com.one.record.repository;

import com.one.record.model.LotteryStrategyPortfolio;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface LotteryStrategyPortfolioRepository extends MongoRepository<LotteryStrategyPortfolio, String> {

    List<LotteryStrategyPortfolio> findByUserIdOrderByUpdatedAtDesc(String userId, Pageable pageable);

    List<LotteryStrategyPortfolio> findByUserIdAndArchivedFalseOrderByUpdatedAtDesc(String userId, Pageable pageable);

    Optional<LotteryStrategyPortfolio> findByIdAndUserId(String id, String userId);

    long countByUserId(String userId);

    long countByUserIdAndArchivedFalse(String userId);
}
