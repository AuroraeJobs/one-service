package com.one.record.repository;

import com.one.record.model.MiniGptGenerationRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MiniGptGenerationRepository extends MongoRepository<MiniGptGenerationRecord, String> {
}
