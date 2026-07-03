package com.one.record.repository;

import com.one.record.model.LotteryTrainingReportRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LotteryTrainingReportRepository extends MongoRepository<LotteryTrainingReportRecord, String> {

    List<LotteryTrainingReportRecord> findByOrderByCreatedAtDesc(Pageable pageable);
}
