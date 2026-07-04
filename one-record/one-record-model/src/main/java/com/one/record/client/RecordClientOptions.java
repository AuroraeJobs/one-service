package com.one.record.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordClientOptions implements Serializable {

    public static final String NETWORK_MODE_SYSTEM = "system";

    public static final String NETWORK_MODE_DIRECT = "direct";

    public static final String NETWORK_MODE_PROXY = "proxy";

    private String provider;

    private String networkMode;

    private String proxyHost;

    private Integer proxyPort;

    private Integer timeoutSeconds;

    private Integer diagnosticSnippetLength;

    public static RecordClientOptions defaults() {
        return RecordClientOptions.builder()
                .networkMode(NETWORK_MODE_SYSTEM)
                .timeoutSeconds(30)
                .diagnosticSnippetLength(240)
                .build();
    }
}
