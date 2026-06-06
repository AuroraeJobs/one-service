package com.one.record.service;

import com.one.record.model.ChargeRecord;

import java.util.List;
import java.util.Map;

public interface IChargeRecordService {
    
    ChargeRecord save(ChargeRecord record);
    
    void delete(String id);
    
    ChargeRecord findById(String id);
    
    List<ChargeRecord> findAll();
    
    List<ChargeRecord> findByDateRange(String startDate, String endDate);
    
    List<ChargeRecord> findByChargerType(String chargerType);
    
    List<ChargeRecord> findByLocation(String location);
    
    Map<String, Object> getStatistics();
}
