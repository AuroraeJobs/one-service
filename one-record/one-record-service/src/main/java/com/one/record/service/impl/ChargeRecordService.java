package com.one.record.service.impl;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.record.model.ChargeRecord;
import com.one.record.repository.ChargeRecordRepository;
import com.one.record.service.IChargeRecordService;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@AllArgsConstructor
public class ChargeRecordService implements IChargeRecordService {
    
    private final ChargeRecordRepository repository;
    
    @Override
    public ChargeRecord save(ChargeRecord record) {
        long currentTime = System.currentTimeMillis();
        if (record.getId() == null) {
            record.setCreatedAt(currentTime);
        }
        record.setUpdatedAt(currentTime);
        return repository.save(record);
    }
    
    @Override
    public void delete(String id) {
        repository.deleteById(id);
        log.info("Deleted charge record with id: {}", id);
    }
    
    @Override
    public ChargeRecord findById(String id) {
        return repository.findById(id).orElse(null);
    }
    
    @Override
    public List<ChargeRecord> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }
    
    @Override
    public List<ChargeRecord> findByDateRange(String startDate, String endDate) {
        return repository.findByDateBetweenOrderByDateAsc(startDate, endDate);
    }
    
    @Override
    public List<ChargeRecord> findByChargerType(String chargerType) {
        return repository.findByChargerTypeOrderByCreatedAtDesc(chargerType);
    }
    
    @Override
    public List<ChargeRecord> findByLocation(String location) {
        return repository.findByLocationOrderByCreatedAtDesc(location);
    }
    
    @Override
    public Map<String, Object> getStatistics() {
        List<ChargeRecord> records = findAll();
        
        Map<String, Object> stats = new HashMap<>();
        
        if (records.isEmpty()) {
            stats.put("totalCharges", 0);
            stats.put("totalEnergy", 0.0);
            stats.put("totalCost", 0.0);
            stats.put("totalElectricityCost", 0.0);
            stats.put("totalServiceCost", 0.0);
            stats.put("avgDuration", 0.0);
            return stats;
        }
        
        int totalCharges = records.size();
        double totalEnergy = records.stream()
                .mapToDouble(ChargeRecord::getChargeAmount)
                .sum();
        double totalElectricityCost = records.stream()
                .mapToDouble(ChargeRecord::getElectricityCost)
                .sum();
        double totalServiceCost = records.stream()
                .mapToDouble(ChargeRecord::getServiceCost)
                .sum();
        double totalDiscountAmount = records.stream()
                .mapToDouble(r -> r.getDiscountAmount() != null ? r.getDiscountAmount() : 0)
                .sum();
        double totalCost = totalElectricityCost + totalServiceCost - totalDiscountAmount;
        double avgDuration = records.stream()
                .mapToInt(ChargeRecord::getChargeDuration)
                .average()
                .orElse(0.0);
        
        stats.put("totalCharges", totalCharges);
        stats.put("totalEnergy", Math.round(totalEnergy * 10) / 10.0);
        stats.put("totalCost", Math.round(totalCost * 100) / 100.0);
        stats.put("totalElectricityCost", Math.round(totalElectricityCost * 100) / 100.0);
        stats.put("totalServiceCost", Math.round(totalServiceCost * 100) / 100.0);
        stats.put("totalDiscountAmount", Math.round(totalDiscountAmount * 100) / 100.0);
        stats.put("avgDuration", Math.round(avgDuration));
        
        return stats;
    }
}
