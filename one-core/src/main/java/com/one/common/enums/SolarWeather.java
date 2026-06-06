package com.one.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum SolarWeather {

    YS("01", "雨水"),
    JZ("02", "惊蛰"),
    QM("03", "清明"),
    GY("04", "谷雨"),
    XM("05", "小满"),
    MZ("06", "芒种"),
    XS("07", "小暑"),
    DS("08", "大暑"),
    CS("09", "处暑"),
    BL("10", "白露"),
    HL("11", "寒露"),
    SJ("12", "霜降"),
    XX("13", "小雪"),
    DX("14", "大雪"),
    XH("15", "小寒"),
    DH("16", "大寒"),
    ;

    private final String id;
    private final String name;

    public static SolarWeather getById(String id) {
        for (SolarWeather value : values()) {
            if (value.id.equals(id)) {
                return value;
            }
        }
        return null;
    }
}
