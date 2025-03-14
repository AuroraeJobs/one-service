package org.aurorae.tsdb.opentsdb.config;

import org.aurorae.tsdb.opentsdb.TsdbClient;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(OpenTsdbProperties.class)
public class OpenTsdbAutoConfiguration {

    @Bean
    public TsdbClient<?, ?> tsdbClient(OpenTsdbProperties properties) {
        return new TsdbClient<>(properties.getUrl());
    }
}
