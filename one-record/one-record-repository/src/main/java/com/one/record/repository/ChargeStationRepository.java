package com.one.record.repository;

import com.one.record.model.ChargeStation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChargeStationRepository extends MongoRepository<ChargeStation, String> {
    
    Optional<ChargeStation> findByStationCode(String stationCode);
    
    List<ChargeStation> findByProvider(String provider);
    
    List<ChargeStation> findByLocation(String location);
    
    List<ChargeStation> findByProviderAndLocation(String provider, String location);
    
    boolean existsByStationCode(String stationCode);
    
    List<ChargeStation> findAllByOrderByCreatedAtDesc();
}