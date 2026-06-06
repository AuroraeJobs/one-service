package com.one.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Solar {

    SX("水星", 0),
    JX("金星", 1),
    YQ("月球", 2),
    HX("火星", 3),
    MX("木星", 4),
    TX("土星", 5),
    TY("太阳", 6),
    ;

    private final String name;
    private final int index;
}
