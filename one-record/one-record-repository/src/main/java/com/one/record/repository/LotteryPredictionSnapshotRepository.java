package com.one.record.repository;

import com.one.record.model.LotteryPredictionSnapshot;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LotteryPredictionSnapshotRepository extends MongoRepository<LotteryPredictionSnapshot, String> {

    List<LotteryPredictionSnapshot> findByOrderByCreatedAtDesc(Pageable pageable);
}
