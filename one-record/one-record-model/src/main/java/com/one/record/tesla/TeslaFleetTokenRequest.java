package com.one.record.tesla;

import lombok.Data;

@Data
public class TeslaFleetTokenRequest {

    private String code;

    private String refreshToken;

    private String scope;

    private String redirectUri;
}
