package com.one.record.tesla;

import lombok.Data;

import java.util.Map;

@Data
public class TeslaFleetVehicleCache {

    private Map<String, Object> vehicles;

    private Long updatedAt;
}
