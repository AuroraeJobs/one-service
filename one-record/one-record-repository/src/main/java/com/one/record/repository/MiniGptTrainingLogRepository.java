package com.one.record.repository;

import com.one.record.model.MiniGptTrainingLogRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MiniGptTrainingLogRepository extends MongoRepository<MiniGptTrainingLogRecord, String> {

    List<MiniGptTrainingLogRecord> findByRunNameOrderByStepAsc(String runName, Pageable pageable);

    Optional<MiniGptTrainingLogRecord> findByRunNameAndStep(String runName, Integer step);

    Optional<MiniGptTrainingLogRecord> findFirstByRunNameOrderByStepDesc(String runName);

    long countByRunName(String runName);
}
