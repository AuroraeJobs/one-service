package com.one.record.tesla;

import lombok.Data;

@Data
public class TeslaFleetTokenStatus {

    private String accountKey;

    private boolean hasAccessToken;

    private boolean hasRefreshToken;

    private Long expiresAt;

    private Long updatedAt;

    private String tokenType;

    private String scope;
}
