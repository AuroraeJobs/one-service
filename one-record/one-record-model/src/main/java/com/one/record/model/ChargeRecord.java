package com.one.record.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.one.record.enums.ChargeProvider;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "charge_records")
public class ChargeRecord {
    
    @Id
    private String id;
    
    private String date;
    
    private String startTime;
    
    private String endTime;
    
    private String location;
    
    private String chargerType;
    
    private Integer chargeDuration;
    
    private Double chargeAmount;
    
    private Double electricityCost;
    
    private Double serviceCost;
    
    private Double discountAmount;
    
    private String notes;
    
    private Double batteryCapacity;
    
    private ChargeProvider provider;
    
    private Long createdAt;
    
    private Long updatedAt;
}
