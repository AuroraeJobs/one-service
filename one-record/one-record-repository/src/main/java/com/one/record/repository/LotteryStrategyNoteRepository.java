package com.one.record.repository;

import com.one.record.model.LotteryStrategyNote;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface LotteryStrategyNoteRepository extends MongoRepository<LotteryStrategyNote, String> {

    List<LotteryStrategyNote> findByUserIdOrderByUpdatedAtDesc(String userId, Pageable pageable);

    List<LotteryStrategyNote> findByUserIdAndArchivedFalseOrderByUpdatedAtDesc(String userId, Pageable pageable);

    List<LotteryStrategyNote> findByUserIdAndStatusAndArchivedFalseOrderByUpdatedAtDesc(String userId, String status, Pageable pageable);

    Optional<LotteryStrategyNote> findByIdAndUserId(String id, String userId);

    long countByUserId(String userId);

    long countByUserIdAndArchivedFalse(String userId);

    long countByUserIdAndStatusAndArchivedFalse(String userId, String status);
}
