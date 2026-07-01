package com.one.security.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "one.security.oauth2")
public class OAuth2LoginProperties {

    private String successRedirectUri = "http://localhost:5173/login?oauth=success";

    private String failureRedirectUri = "http://localhost:5173/login?oauth=error";

    private String bindSuccessRedirectUri = "http://localhost:5173/settings?githubBind=success";

    private String bindFailureRedirectUri = "http://localhost:5173/settings?githubBind=error";

    private String bindLoginRedirectUri = "http://localhost:5173/login?oauthBind=github";
}
