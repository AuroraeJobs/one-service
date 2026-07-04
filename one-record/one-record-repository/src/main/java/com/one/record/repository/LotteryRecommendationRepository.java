package com.one.record.repository;

import com.one.record.model.LotteryRecommendation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface LotteryRecommendationRepository extends MongoRepository<LotteryRecommendation, String> {

    List<LotteryRecommendation> findByUserIdAndArchivedFalseOrderByUpdatedAtDesc(String userId, Pageable pageable);

    List<LotteryRecommendation> findByUserIdAndArchivedFalseAndRecommendationStateOrderByUpdatedAtDesc(String userId, String recommendationState, Pageable pageable);

    Optional<LotteryRecommendation> findByIdAndUserId(String id, String userId);

    Optional<LotteryRecommendation> findByUserIdAndTargetTypeAndTargetId(String userId, String targetType, String targetId);

    long countByUserIdAndArchivedFalse(String userId);
}
