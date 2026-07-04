package com.one.record.repository;

import com.one.record.model.LotteryPreference;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface LotteryPreferenceRepository extends MongoRepository<LotteryPreference, String> {

    Optional<LotteryPreference> findByUserId(String userId);
}
