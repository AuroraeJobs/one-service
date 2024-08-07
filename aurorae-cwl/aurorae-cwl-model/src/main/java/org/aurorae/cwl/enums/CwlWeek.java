package org.aurorae.cwl.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum CwlWeek {

    SUN("日", 0),
    MON("一", 1),
    TUE("二", 2),
    WED("三", 3),
    THU("四", 4),
    FRI("五", 5),
    SAT("六", 6);

    private final String name;
    private final int value;

    public static int getValueByName(String n) {
        for (CwlWeek val : values()) {
            if (val.name.equals(n)) {
                return val.value;
            }
        }
        return -1;
    }

    public static String getNameByValue(int v) {
        for (CwlWeek val : values()) {
            if (val.value == v) {
                return val.name;
            }
        }
        return null;
    }
}
