package com.one.record.tesla;

import lombok.Data;

import java.util.Map;

@Data
public class TeslaFleetTelemetryCache {

    private String vin;

    private String recordType;

    private String channel;

    private Map<String, Object> data;

    private Long updatedAt;
}
