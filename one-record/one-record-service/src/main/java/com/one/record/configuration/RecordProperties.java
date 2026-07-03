package com.one.record.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "hello.record")
public class RecordProperties {

    private boolean init;

    private boolean update;

    private boolean reset;

    private boolean scheduledSyncEnabled;
}
