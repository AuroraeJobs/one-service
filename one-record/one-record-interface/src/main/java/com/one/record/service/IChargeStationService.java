package com.one.record.service;

import com.one.record.model.ChargeStation;

import java.util.List;

public interface IChargeStationService {
    
    ChargeStation save(ChargeStation station);
    
    ChargeStation update(ChargeStation station);
    
    void delete(String id);
    
    ChargeStation findById(String id);
    
    ChargeStation findByStationCode(String stationCode);
    
    List<ChargeStation> findAll();
    
    List<ChargeStation> findByProvider(String provider);
    
    List<ChargeStation> findByLocation(String location);
    
    List<ChargeStation> findByProviderAndLocation(String provider, String location);
}