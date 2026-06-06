package com.one.record.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ChargeProvider {

    TESLA("特斯拉"),
    TELEMATICS("特来电"),
    YSC("悦速充"),
    YKC("云快充"),
    STAR("星星充电"),
    DIDI("滴滴充电"),
    NATIONAL_GRID("国家电网"),
    ;

    private final String name;
}
