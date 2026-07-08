package com.one.record.repository;

import com.one.record.model.OpenAiTrainingReportRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OpenAiTrainingReportRepository extends MongoRepository<OpenAiTrainingReportRecord, String> {

    List<OpenAiTrainingReportRecord> findByOrderByCreatedAtDesc(Pageable pageable);
}
