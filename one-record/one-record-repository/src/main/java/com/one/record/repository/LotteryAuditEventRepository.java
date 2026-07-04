package com.one.record.repository;

import com.one.record.model.LotteryAuditEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface LotteryAuditEventRepository extends MongoRepository<LotteryAuditEvent, String> {

    List<LotteryAuditEvent> findByOrderByGeneratedAtDesc(Pageable pageable);
}
