package com.one.record.service;

import com.one.record.model.SalaryRecord;

import java.util.List;
import java.util.Map;

public interface ISalaryRecordService {
    
    SalaryRecord save(SalaryRecord record);
    
    void delete(String id);
    
    SalaryRecord findById(String id);
    
    List<SalaryRecord> findAll();
    
    SalaryRecord findByMonth(String month);
    
    List<SalaryRecord> findByMonthRange(String startMonth, String endMonth);
    
    Map<String, Object> getStatistics();
}