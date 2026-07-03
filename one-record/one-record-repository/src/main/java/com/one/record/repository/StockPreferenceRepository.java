package com.one.record.repository;

import com.one.record.stock.StockPreference;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface StockPreferenceRepository extends MongoRepository<StockPreference, String> {

    Optional<StockPreference> findByUserId(String userId);
}
