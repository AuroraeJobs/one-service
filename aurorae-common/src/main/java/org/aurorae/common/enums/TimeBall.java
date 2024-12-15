package org.aurorae.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum TimeBall implements IBall {

    /**
     * 二十四 节气
     * 立春，春分
     * 立夏，夏至
     * 立秋，秋分
     * 立冬，冬至
     */
    YS("01", "Rain Water", "雨水"),
    JC("02", "Awakening of Insects", "惊蛰"),
    QM("03", "Clear and Bright", "清明"),
    GY("04", "Grain Rain", "谷雨"),
    XM("05", "Grain Full", "小满"),
    MZ("06", "Grain in Ear", "芒种"),
    XS("07", "Minor Heat", "小暑"),
    DS("08", "Major Heat", "大暑"),
    CS("09", "Limit of Heat", "处暑"),
    BL("10", "White Dew", "白露"),
    HL("11", "Cold Dew", "寒露"),
    SJ("12", "Frost's Descent", "霜降"),
    XX("13", "Minor Snow", "小雪"),
    DX("14", "Major Snow", "大雪"),
    XH("15", "Minor Cold", "小寒"),
    DH("16", "Major Cold", "大寒");

    private final String id;
    private final String name;
    private final String label;
}
