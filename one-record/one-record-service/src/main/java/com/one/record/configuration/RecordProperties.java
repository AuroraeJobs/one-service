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

    private String scheduledSyncCron = "0 30 22 * * SUN,TUE,THU";

    private String providerNetworkMode = "system";

    private String providerProxyHost;

    private Integer providerProxyPort;

    private Integer providerTimeoutSeconds = 30;

    private Integer providerDiagnosticSnippetLength = 240;
}
