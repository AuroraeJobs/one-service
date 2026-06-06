package com.one.record.tesla;

import lombok.Data;

import java.util.Map;

@Data
public class TeslaFleetApiCache {

    private String type;

    private String key;

    private Map<String, Object> data;

    private Long updatedAt;
}
