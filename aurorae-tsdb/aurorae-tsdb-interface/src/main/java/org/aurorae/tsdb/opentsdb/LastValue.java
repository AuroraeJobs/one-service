package org.aurorae.tsdb.opentsdb;

import lombok.Data;

import java.util.Map;

@Data
public class LastValue {

    private String metric;
    private Long timestamp;
    private Object value;
    private String tsuid;
    private Map<String, Object> tags;
}
