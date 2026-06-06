package com.one.record.repository;

import com.one.record.model.SalaryRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryRecordRepository extends MongoRepository<SalaryRecord, String> {
    
    List<SalaryRecord> findAllByOrderByYearDescMonthDesc();
    
    List<SalaryRecord> findByYearOrderByMonth(Integer year);
    
    Optional<SalaryRecord> findByYearAndMonth(Integer year, Integer month);
    
    Optional<SalaryRecord> findByMonth(String month);
    
    List<SalaryRecord> findByMonthBetweenOrderByMonthDesc(String startMonth, String endMonth);
}
