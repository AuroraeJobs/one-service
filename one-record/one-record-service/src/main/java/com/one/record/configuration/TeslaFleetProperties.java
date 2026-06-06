package com.one.record.configuration;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "tesla.fleet")
public class TeslaFleetProperties {

    private String authBaseUrl = "https://auth.tesla.cn/oauth2/v3";

    private String apiBaseUrl = "https://fleet-api.prd.cn.vn.cloud.tesla.cn";

    private String commandProxyBaseUrl = "";

    private Boolean commandSdkEnabled = false;

    private String commandSdkBinary = "tesla-http-proxy";

    private String commandSdkTlsCert = "";

    private String commandSdkTlsKey = "";

    private String commandSdkPrivateKey = "";

    private String commandSdkHost = "127.0.0.1";

    private String commandSdkClientHost = "127.0.0.1";

    private Integer commandSdkPort = 4443;

    private String commandSdkCacheFile = "";

    private Boolean commandSdkVerbose = false;

    private Boolean telemetryEnabled = false;

    private String telemetryBinary = "fleet-telemetry";

    private String telemetryConfigFile = "";

    private String telemetryHost = "0.0.0.0";

    private Integer telemetryPort = 443;

    private Integer telemetryStatusPort = 8080;

    private String telemetryLogLevel = "info";

    private String telemetryNamespace = "tesla_telemetry";

    private Boolean telemetryJsonLogEnabled = true;

    private Boolean telemetryTransmitDecodedRecords = true;

    private Boolean telemetryReliableAck = false;

    private String telemetryTlsCert = "";

    private String telemetryTlsKey = "";

    private String telemetryTlsCaFile = "";

    private String telemetryRedisAddrs = "127.0.0.1:6379";

    private String telemetryRedisUsername = "";

    private String telemetryRedisPassword = "";

    private Integer telemetryRedisDb = 0;

    private Boolean telemetryRedisPublishVinTopics = true;

    private String telemetryRedisSubscriberSetPrefix = "";

    private String clientId;

    private String clientSecret;

    private String redirectUri;

    private String scope = "openid offline_access user_data vehicle_device_data vehicle_location vehicle_cmds vehicle_charging_cmds";

    private String partnerScope = "openid user_data vehicle_device_data vehicle_cmds vehicle_charging_cmds";

    private String publicKey = "";
}
