package com.one.record.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "charge_stations")
public class ChargeStation {

    @Id
    private String id;
    
    private String provider;
    
    private String location;
    
    private String stationCode;
    
    private String stationName;
    
    private Long createdAt;
    
    private Long updatedAt;
}
