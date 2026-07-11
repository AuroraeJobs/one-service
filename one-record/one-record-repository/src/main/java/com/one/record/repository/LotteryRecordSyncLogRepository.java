package com.one.record.repository;

import com.one.record.model.LotteryRecordSyncLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LotteryRecordSyncLogRepository extends MongoRepository<LotteryRecordSyncLog, String>,
        LotteryRecordSyncLogPageRepository {

    List<LotteryRecordSyncLog> findByOrderByStartedAtDesc(Pageable pageable);

    List<LotteryRecordSyncLog> findByStatusOrderByStartedAtDesc(String status, Pageable pageable);
}
