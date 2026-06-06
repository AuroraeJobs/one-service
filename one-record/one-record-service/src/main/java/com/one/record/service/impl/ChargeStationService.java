package com.one.record.service.impl;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.record.model.ChargeStation;
import com.one.record.repository.ChargeStationRepository;
import com.one.record.service.IChargeStationService;
import com.one.common.exception.DuplicateException;
import com.one.common.exception.NotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@AllArgsConstructor
public class ChargeStationService implements IChargeStationService {
    
    private final ChargeStationRepository repository;
    
    @Override
    public ChargeStation save(ChargeStation station) {
        log.info("Saving charge station: {}", station);
        
        if (repository.existsByStationCode(station.getStationCode())) {
            throw new DuplicateException("站点编码已存在: " + station.getStationCode());
        }
        
        station.setCreatedAt(LocalDateTime.now());
        station.setUpdatedAt(LocalDateTime.now());
        return repository.save(station);
    }
    
    @Override
    public ChargeStation update(ChargeStation station) {
        log.info("Updating charge station: {}", station);
        
        ChargeStation existing = repository.findById(station.getId())
                .orElseThrow(() -> new NotFoundException("充电站不存在: " + station.getId()));
        
        if (!existing.getStationCode().equals(station.getStationCode()) 
                && repository.existsByStationCode(station.getStationCode())) {
            throw new DuplicateException("站点编码已存在: " + station.getStationCode());
        }
        
        existing.setProvider(station.getProvider());
        existing.setLocation(station.getLocation());
        existing.setStationCode(station.getStationCode());
        existing.setStationName(station.getStationName());
        existing.setUpdatedAt(LocalDateTime.now());
        
        return repository.save(existing);
    }
    
    @Override
    public void delete(String id) {
        log.info("Deleting charge station with id: {}", id);
        
        if (!repository.existsById(id)) {
            throw new NotFoundException("充电站不存在: " + id);
        }
        
        repository.deleteById(id);
    }
    
    @Override
    public ChargeStation findById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("充电站不存在: " + id));
    }
    
    @Override
    public ChargeStation findByStationCode(String stationCode) {
        return repository.findByStationCode(stationCode)
                .orElseThrow(() -> new NotFoundException("站点编码不存在: " + stationCode));
    }
    
    @Override
    public List<ChargeStation> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }
    
    @Override
    public List<ChargeStation> findByProvider(String provider) {
        return repository.findByProvider(provider);
    }
    
    @Override
    public List<ChargeStation> findByLocation(String location) {
        return repository.findByLocation(location);
    }
    
    @Override
    public List<ChargeStation> findByProviderAndLocation(String provider, String location) {
        return repository.findByProviderAndLocation(provider, location);
    }
}