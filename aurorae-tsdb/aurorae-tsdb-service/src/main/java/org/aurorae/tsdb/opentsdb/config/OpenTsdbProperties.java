package org.aurorae.tsdb.opentsdb.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "opentsdb")
public class OpenTsdbProperties {

    private String url;
}
