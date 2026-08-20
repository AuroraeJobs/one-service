package com.one.record.service;

import com.one.record.model.ChargeStation;

import java.util.List;

public interface IChargeStationService {
    
    ChargeStation save(ChargeStation station);
    
    ChargeStation update(ChargeStation station);
    
    void delete(String id);
    
    ChargeStation findById(String id);
    
    ChargeStation findByStationCode(String stationCode);
    
    /**
     * 更新充电站的最近一次充电时间（新增充电记录选择该站点时调用）
     */
    ChargeStation markLastChargeAt(String stationCode);
    
    List<ChargeStation> findAll();
    
    List<ChargeStation> findByProvider(String provider);
    
    List<ChargeStation> findByLocation(String location);
    
    List<ChargeStation> findByProviderAndLocation(String provider, String location);
}