package com.one.record.repository;

import com.one.record.model.ChargeRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChargeRecordRepository extends MongoRepository<ChargeRecord, String> {
    
    List<ChargeRecord> findAllByOrderByCreatedAtDesc();
    
    List<ChargeRecord> findByDateBetweenOrderByDateAsc(String startDate, String endDate);
    
    List<ChargeRecord> findByChargerTypeOrderByCreatedAtDesc(String chargerType);
    
    List<ChargeRecord> findByLocationOrderByCreatedAtDesc(String location);
}
