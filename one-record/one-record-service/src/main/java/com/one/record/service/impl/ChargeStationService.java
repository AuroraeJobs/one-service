package com.one.record.service.impl;

import com.one.record.enums.ChargeProvider;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.record.model.ChargeStation;
import com.one.record.repository.ChargeStationRepository;
import com.one.record.service.IChargeStationService;
import com.one.common.exception.DuplicateException;
import com.one.common.exception.NotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
        
        long now = System.currentTimeMillis();
        station.setCreatedAt(now);
        station.setLastChargeAt(now);
        station.setUpdatedAt(now);
        return repository.save(station);
    }
    
    @Override
    public ChargeStation markLastChargeAt(String stationCode) {
        ChargeStation station = findByStationCode(stationCode);
        station.setLastChargeAt(System.currentTimeMillis());
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
        existing.setUpdatedAt(System.currentTimeMillis());
        
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
        return repository.findAllByOrderByLastChargeAtDesc();
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
    
    @Override
    public String getNextStationCode(String provider) {
        // 获取提供商的编码前缀
        ChargeProvider chargeProvider;
        try {
            chargeProvider = ChargeProvider.valueOf(provider);
        } catch (IllegalArgumentException e) {
            throw new NotFoundException("未知的提供商: " + provider);
        }
        
        String prefix = chargeProvider.getCode();
        
        // 查询该提供商的所有充电站
        List<ChargeStation> stations = repository.findByProvider(provider);
        
        // 找到最大的编号
        int maxNum = 0;
        Pattern pattern = Pattern.compile("^" + prefix + "(\\d{3})$");
        
        for (ChargeStation station : stations) {
            String stationCode = station.getStationCode();
            if (stationCode != null) {
                Matcher matcher = pattern.matcher(stationCode);
                if (matcher.matches()) {
                    int num = Integer.parseInt(matcher.group(1));
                    maxNum = Math.max(maxNum, num);
                }
            }
        }
        
        // 生成下一个编码
        int nextNum = maxNum + 1;
        if (nextNum > 999) {
            throw new RuntimeException("提供商 " + provider + " 的站点编码已用完");
        }
        
        return prefix + String.format("%03d", nextNum);
    }
}
