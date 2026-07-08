package com.one.record.repository;

import com.one.record.model.MiniGptRunRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MiniGptRunRepository extends MongoRepository<MiniGptRunRecord, String> {

    Optional<MiniGptRunRecord> findFirstByOrderByUpdatedAtDesc();

    Optional<MiniGptRunRecord> findByRunName(String runName);

    List<MiniGptRunRecord> findByOrderByUpdatedAtDesc(Pageable pageable);
}
