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
    
    /**
     * 最近一次充电时间（新增充电记录选择该站点时更新，倒序靠前的排在下拉列表最前）
     */
    private Long lastChargeAt;
    
    private Long createdAt;
    
    private Long updatedAt;
}
