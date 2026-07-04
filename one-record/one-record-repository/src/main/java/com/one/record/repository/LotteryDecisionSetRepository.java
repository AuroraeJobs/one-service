package com.one.record.repository;

import com.one.record.model.LotteryDecisionSet;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface LotteryDecisionSetRepository extends MongoRepository<LotteryDecisionSet, String> {

    List<LotteryDecisionSet> findByUserIdOrderByUpdatedAtDesc(String userId, Pageable pageable);

    List<LotteryDecisionSet> findByUserIdAndArchivedFalseOrderByUpdatedAtDesc(String userId, Pageable pageable);

    Optional<LotteryDecisionSet> findByIdAndUserId(String id, String userId);

    long countByUserId(String userId);

    long countByUserIdAndArchivedFalse(String userId);
}
