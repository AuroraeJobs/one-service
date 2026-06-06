package com.one.record.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum RecordWeek {

    SUN("日", 1),
    MON("一", 2),
    TUE("二", 3),
    WED("三", 4),
    THU("四", 5),
    FRI("五", 6),
    SAT("六", 7);

    private final String name;
    private final int value;

    public static int getValueByName(String n) {
        for (RecordWeek val : values()) {
            if (val.name.equals(n)) {
                return val.value;
            }
        }
        return -1;
    }

    public static String getNameByValue(int v) {
        for (RecordWeek val : values()) {
            if (val.value == v) {
                return val.name;
            }
        }
        return null;
    }
}
