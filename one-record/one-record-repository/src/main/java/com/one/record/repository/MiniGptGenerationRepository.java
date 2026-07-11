package com.one.record.repository;

import com.one.record.model.MiniGptGenerationRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MiniGptGenerationRepository extends MongoRepository<MiniGptGenerationRecord, String> {

    List<MiniGptGenerationRecord> findByGenerationIdIn(List<String> generationIds);

    List<MiniGptGenerationRecord> findByBatchIdOrderByGeneratedAtAsc(String batchId);
}
