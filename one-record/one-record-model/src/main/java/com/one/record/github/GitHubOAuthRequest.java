package com.one.record.github;

import lombok.Data;

@Data
public class GitHubOAuthRequest {

    private String code;

    private String state;

    private String redirectUri;

    private String localUserId;

    private String localUsername;
}
