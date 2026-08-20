package com.one.record.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum SalaryCompany {

    QUELLINK("移为Queclink"),
    PROUDSMART("普奥Proudsmart"),
    MOXI("摩羲MOXI"),
    ;

    private final String name;
}