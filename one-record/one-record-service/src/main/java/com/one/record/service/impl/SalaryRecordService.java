package com.one.record.service.impl;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.record.config.TaxConfig;
import com.one.record.model.SalaryRecord;
import com.one.record.repository.SalaryRecordRepository;
import com.one.record.service.ISalaryRecordService;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class SalaryRecordService implements ISalaryRecordService {
    
    private final SalaryRecordRepository repository;
    private final TaxConfig taxConfig;
    
    @Override
    public SalaryRecord save(SalaryRecord record) {
        calculateAndSetDerivedFields(record);
        
        long currentTime = System.currentTimeMillis();
        if (record.getId() == null) {
            record.setCreatedAt(currentTime);
        }
        record.setUpdatedAt(currentTime);
        
        SalaryRecord savedRecord = repository.save(record);
        
        recalculateAllRecordsForYear(savedRecord.getYear());
        
        return repository.findById(savedRecord.getId()).orElse(savedRecord);
    }
    
    @Override
    public void delete(String id) {
        SalaryRecord record = repository.findById(id).orElse(null);
        if (record != null) {
            repository.deleteById(id);
            log.info("Deleted salary record with id: {}", id);
            if (record.getYear() != null) {
                recalculateAllRecordsForYear(record.getYear());
            }
        }
    }
    
    @Override
    public SalaryRecord findById(String id) {
        return repository.findById(id).orElse(null);
    }
    
    @Override
    public List<SalaryRecord> findAll() {
        return repository.findAllByOrderByYearDescMonthDesc();
    }
    
    @Override
    public SalaryRecord findByMonth(String month) {
        return repository.findByMonth(month).orElse(null);
    }
    
    @Override
    public List<SalaryRecord> findByMonthRange(String startMonth, String endMonth) {
        return repository.findByMonthBetweenOrderByMonthDesc(startMonth, endMonth);
    }
    
    @Override
    public Map<String, Object> getStatistics() {
        List<SalaryRecord> records = findAll();
        
        Map<String, Object> stats = new HashMap<>();
        
        if (records.isEmpty()) {
            stats.put("totalRecords", 0);
            stats.put("totalMonthlyIncome", 0.0);
            stats.put("totalActualIncome", 0.0);
            stats.put("totalTaxPaid", 0.0);
            stats.put("avgActualIncome", 0.0);
            return stats;
        }
        
        int totalRecords = records.size();
        double totalMonthlyIncome = records.stream()
                .mapToDouble(r -> r.getMonthlyIncome() != null ? r.getMonthlyIncome() : 0.0)
                .sum();
        double totalActualIncome = records.stream()
                .mapToDouble(r -> r.getActualIncome() != null ? r.getActualIncome() : 0.0)
                .sum();
        double totalTaxPaid = records.stream()
                .mapToDouble(r -> r.getCurrentTaxDeclaration() != null ? r.getCurrentTaxDeclaration() : 0.0)
                .sum();
        double avgActualIncome = totalActualIncome / totalRecords;
        
        stats.put("totalRecords", totalRecords);
        stats.put("totalMonthlyIncome", Math.round(totalMonthlyIncome * 100) / 100.0);
        stats.put("totalActualIncome", Math.round(totalActualIncome * 100) / 100.0);
        stats.put("totalTaxPaid", Math.round(totalTaxPaid * 100) / 100.0);
        stats.put("avgActualIncome", Math.round(avgActualIncome * 100) / 100.0);
        
        return stats;
    }
    
    private void calculateAndSetDerivedFields(SalaryRecord record) {
        if (record.getStandardDeduction() == null || record.getStandardDeduction() <= 0) {
            record.setStandardDeduction(taxConfig.getStandardDeductionPerMonth());
        }
        
        double endowment = record.getEndowmentInsurance() != null ? record.getEndowmentInsurance() : 0.0;
        double medical = record.getMedicalInsurance() != null ? record.getMedicalInsurance() : 0.0;
        double unemployment = record.getUnemploymentInsurance() != null ? record.getUnemploymentInsurance() : 0.0;
        double housing = record.getHousingFund() != null ? record.getHousingFund() : 0.0;
        
        double specialDeduction = endowment + medical + unemployment + housing;
        record.setSpecialDeduction(specialDeduction);
        
        double monthlyIncome = record.getMonthlyIncome() != null ? record.getMonthlyIncome() : 0.0;
        double monthlyTaxableIncome = monthlyIncome - record.getStandardDeduction() - specialDeduction;
        record.setMonthlyTaxableIncome(Math.max(0, monthlyTaxableIncome));
    }
    
    private void recalculateAllRecordsForYear(Integer year) {
        if (year == null) {
            return;
        }
        
        List<SalaryRecord> records = repository.findByYearOrderByMonth(year);
        records = records.stream()
                .sorted(Comparator.comparing(SalaryRecord::getMonth))
                .collect(Collectors.toList());
        
        double cumulativeTaxableIncome = 0.0;
        double cumulativeTaxPaid = 0.0;
        
        for (SalaryRecord record : records) {
            double monthlyTaxableIncome = record.getMonthlyTaxableIncome() != null ? record.getMonthlyTaxableIncome() : 0.0;
            cumulativeTaxableIncome += monthlyTaxableIncome;
            record.setCumulativeTaxableIncome(cumulativeTaxableIncome);
            
            double cumulativeTaxPayable = taxConfig.calculateTax(cumulativeTaxableIncome);
            record.setCumulativeTaxPayable(cumulativeTaxPayable);
            
            double currentTaxDeclaration = cumulativeTaxPayable - cumulativeTaxPaid;
            record.setCurrentTaxDeclaration(Math.max(0, currentTaxDeclaration));
            
            record.setCumulativeTaxPaid(cumulativeTaxPaid);
            
            double monthlyIncome = record.getMonthlyIncome() != null ? record.getMonthlyIncome() : 0.0;
            double specialDeduction = record.getSpecialDeduction() != null ? record.getSpecialDeduction() : 0.0;
            double actualIncome = monthlyIncome - specialDeduction - record.getCurrentTaxDeclaration();
            record.setActualIncome(actualIncome);
            
            repository.save(record);
            
            cumulativeTaxPaid += record.getCurrentTaxDeclaration();
        }
    }
}
