package org.aurorae.tsdb.hbase.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@ConfigurationProperties(prefix = "hbase")
public class HBaseProperties {

    private boolean enable;

    private int restPort;

    private Map<String, String> config = new HashMap<>();

    private List<HBaseTableProperties> tables;
}
