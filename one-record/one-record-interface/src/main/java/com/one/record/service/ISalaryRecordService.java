package com.one.record.service;

import com.one.record.model.AnnualTaxSettlement;
import com.one.record.model.SalaryRecord;

import java.util.List;
import java.util.Map;

public interface ISalaryRecordService {
    
    SalaryRecord save(SalaryRecord record);
    
    /**
     * 将指定记录标记为重新累计起始点（跳槽后新公司首月），并重算该年份累计数据
     */
    SalaryRecord resetCumulation(String id);
    
    void delete(String id);
    
    SalaryRecord findById(String id);
    
    List<SalaryRecord> findAll();
    
    SalaryRecord findByMonth(String month);
    
    List<SalaryRecord> findByMonthRange(String startMonth, String endMonth);

    AnnualTaxSettlement calculateAnnualSettlement(Integer year);
    
    Map<String, Object> getStatistics();
}
