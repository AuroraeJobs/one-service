package com.one.record.configuration;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "wechat.official-account")
public class WechatOfficialAccountProperties {

    private String appId = "";

    private String appSecret = "";

    private String thumbMediaId = "";

    private String author = "OneAI";

    private String apiBaseUrl = "https://api.weixin.qq.com";

    private Integer needOpenComment = 0;

    private Integer onlyFansCanComment = 0;

    private Boolean cacheToken = true;

    private Long tokenRefreshSkewSeconds = 300L;
}
