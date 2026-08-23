package com.one.record.service.impl;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.common.exception.DuplicateException;
import com.one.record.config.TaxConfig;
import com.one.record.enums.SalaryRecordType;
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
        record.setRecordType(normalizeRecordType(record));

        // 同一年月可分别保存一条工资和奖金记录，同类型不可重复
        if (record.getYear() != null && record.getMonth() != null) {
            Optional<SalaryRecord> existing = repository.findByYearAndMonth(record.getYear(), record.getMonth()).stream()
                    .filter(item -> normalizeRecordType(item) == record.getRecordType())
                    .findFirst();
            if (existing.isPresent()) {
                String existingId = existing.get().getId();
                String currentId = record.getId();
                if (currentId == null || !existingId.equals(currentId)) {
                    String typeName = record.getRecordType() == SalaryRecordType.BONUS ? "奖金" : "工资";
                    throw new DuplicateException("该年月已存在" + typeName + "记录，请修改年月或编辑现有记录");
                }
            }
        }
        
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
        return repository.findAllByOrderByYearDescMonthDescCreatedAtDesc();
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
                .mapToDouble(r -> (r.getMonthlyIncome() != null ? r.getMonthlyIncome() : 0.0) + (r.getOtherIncome() != null ? r.getOtherIncome() : 0.0))
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
    
    @Override
    public SalaryRecord resetCumulation(String id) {
        SalaryRecord record = findById(id);
        if (record == null) {
            return null;
        }
        record.setResetCumulative(true);
        return save(record);
    }
    
    private void calculateAndSetDerivedFields(SalaryRecord record) {
        if (normalizeRecordType(record) == SalaryRecordType.BONUS) {
            double taxRate = record.getTaxRate() != null ? record.getTaxRate() : -1.0;
            if (taxRate < 0 || taxRate > 100) {
                throw new IllegalArgumentException("奖金税率必须在 0 到 100 之间");
            }

            record.setStandardDeduction(0.0);
            record.setEndowmentInsurance(0.0);
            record.setMedicalInsurance(0.0);
            record.setUnemploymentInsurance(0.0);
            record.setHousingFund(0.0);
            record.setSpecialDeduction(0.0);

            double totalIncome = valueOrZero(record.getMonthlyIncome()) + valueOrZero(record.getOtherIncome());
            record.setMonthlyTaxableIncome(Math.max(0, totalIncome));
            return;
        }

        record.setTaxRate(null);
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
        double otherIncome = record.getOtherIncome() != null ? record.getOtherIncome() : 0.0;
        double monthlyTaxableIncome = monthlyIncome - record.getStandardDeduction() - specialDeduction;
        record.setMonthlyTaxableIncome(Math.max(0, monthlyTaxableIncome));
    }
    
    private void recalculateAllRecordsForYear(Integer year) {
        if (year == null) {
            return;
        }
        
        List<SalaryRecord> records = repository.findByYearOrderByMonth(year);
        records = records.stream()
                .sorted(Comparator.comparing(SalaryRecord::getMonth)
                        .thenComparing(record -> normalizeRecordType(record) == SalaryRecordType.SALARY ? 0 : 1))
                .collect(Collectors.toList());
        
        double cumulativeTaxableIncome = 0.0;
        double cumulativeTaxPaid = 0.0;
        
        for (SalaryRecord record : records) {
            record.setRecordType(normalizeRecordType(record));

            if (record.getRecordType() == SalaryRecordType.BONUS) {
                double totalIncome = valueOrZero(record.getMonthlyIncome()) + valueOrZero(record.getOtherIncome());
                double taxRate = record.getTaxRate() != null ? record.getTaxRate() : 0.0;
                double currentTaxDeclaration = roundCurrency(totalIncome * taxRate / 100.0);

                record.setStandardDeduction(0.0);
                record.setEndowmentInsurance(0.0);
                record.setMedicalInsurance(0.0);
                record.setUnemploymentInsurance(0.0);
                record.setHousingFund(0.0);
                record.setSpecialDeduction(0.0);
                record.setMonthlyTaxableIncome(Math.max(0, totalIncome));
                record.setCumulativeTaxableIncome(0.0);
                record.setCumulativeTaxPayable(currentTaxDeclaration);
                record.setCurrentTaxDeclaration(currentTaxDeclaration);
                record.setCumulativeTaxPaid(0.0);
                record.setActualIncome(roundCurrency(totalIncome - currentTaxDeclaration));
                repository.save(record);
                continue;
            }

            if (Boolean.TRUE.equals(record.getResetCumulative())) {
                cumulativeTaxableIncome = 0.0;
                cumulativeTaxPaid = 0.0;
            }
            double monthlyTaxableIncome = record.getMonthlyTaxableIncome() != null ? record.getMonthlyTaxableIncome() : 0.0;
            cumulativeTaxableIncome += monthlyTaxableIncome;
            record.setCumulativeTaxableIncome(cumulativeTaxableIncome);
            
            double cumulativeTaxPayable = taxConfig.calculateTax(cumulativeTaxableIncome);
            record.setCumulativeTaxPayable(cumulativeTaxPayable);
            
            double currentTaxDeclaration = cumulativeTaxPayable - cumulativeTaxPaid;
            record.setCurrentTaxDeclaration(Math.max(0, currentTaxDeclaration));
            
            record.setCumulativeTaxPaid(cumulativeTaxPaid);
            
            double monthlyIncome = record.getMonthlyIncome() != null ? record.getMonthlyIncome() : 0.0;
            double otherIncome = record.getOtherIncome() != null ? record.getOtherIncome() : 0.0;
            double specialDeduction = record.getSpecialDeduction() != null ? record.getSpecialDeduction() : 0.0;
            double actualIncome = monthlyIncome + otherIncome - specialDeduction - record.getCurrentTaxDeclaration();
            record.setActualIncome(actualIncome);
            
            repository.save(record);
            
            cumulativeTaxPaid += record.getCurrentTaxDeclaration();
        }
    }

    private SalaryRecordType normalizeRecordType(SalaryRecord record) {
        return record.getRecordType() != null ? record.getRecordType() : SalaryRecordType.SALARY;
    }

    private double valueOrZero(Double value) {
        return value != null ? value : 0.0;
    }

    private double roundCurrency(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
