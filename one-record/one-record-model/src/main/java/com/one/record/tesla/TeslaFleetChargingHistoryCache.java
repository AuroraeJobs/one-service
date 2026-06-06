package com.one.record.tesla;

import lombok.Data;

import java.util.Map;

@Data
public class TeslaFleetChargingHistoryCache {

    private Map<String, Object> chargingHistory;

    private Long updatedAt;
}
