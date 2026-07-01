package com.one.record.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiModelOption {

    private String id;

    private String name;

    private String provider;

    private String model;

    private boolean available;

    private Map<String, Object> details;
}
