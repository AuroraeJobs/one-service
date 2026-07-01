package com.one.record.configuration;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "github.oauth")
public class GitHubOAuthProperties {

    private String authBaseUrl = "https://github.com/login/oauth";

    private String apiBaseUrl = "https://api.github.com";

    private String clientId;

    private String clientSecret;

    private String redirectUri;

    private String scope = "read:user user:email";
}
