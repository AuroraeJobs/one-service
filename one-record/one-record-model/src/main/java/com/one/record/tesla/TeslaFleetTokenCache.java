package com.one.record.tesla;

import lombok.Data;

@Data
public class TeslaFleetTokenCache {

    private TeslaFleetTokenResponse token;

    private Long expiresAt;

    private Long updatedAt;
}
