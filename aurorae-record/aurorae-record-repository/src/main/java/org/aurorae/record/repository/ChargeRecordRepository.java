package org.aurorae.record.repository;

import org.aurorae.record.model.ChargeRecord;
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
