package com.one.record.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ChargeProvider {

    TESLA("特斯拉", "TSL"),
    TELEMATICS("特来电", "TKL"),
    YSC("悦速充", "YSC"),
    YKC("云快充", "YKC"),
    STAR("星星充电", "XXC"),
    DIDI("滴滴充电", "DDC"),
    NATIONAL_GRID("国家电网", "GJD"),
    ZSH("石化易电", "SHY"),
    BYD("比亚迪", "BYD"),
    LZF("漯周阜", "LZF"),
    ;

    private final String name;
    
    private final String code;
    
    /**
     * 根据编码查找提供商
     */
    public static ChargeProvider fromCode(String code) {
        for (ChargeProvider provider : values()) {
            if (provider.code.equals(code)) {
                return provider;
            }
        }
        return null;
    }
}
