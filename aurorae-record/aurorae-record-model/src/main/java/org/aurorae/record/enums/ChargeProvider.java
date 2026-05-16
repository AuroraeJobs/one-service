package org.aurorae.record.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ChargeProvider {

    TESLA("特斯拉"),
    HUAWEI("华为"),
    TELEMATICS("特来电"),
    STAR("星星充电"),
    LITTLE_WHALE("小桔充电"),
    NATIONAL_GRID("国家电网"),
    ;

    private final String name;
}
