package org.aurorae.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum IslandProvince implements IProvince {

    /**
     * 二十四 节气
     * 立春，春分
     * 立夏，夏至
     * 立秋，秋分
     * 立冬，冬至
     */
    YS(1, "Rain Water", "雨水"),
    JC(2, "Awakening of Insects", "惊蛰"),
    QM(3, "Clear and Bright", "清明"),
    GY(4, "Grain Rain", "谷雨"),
    XM(5, "Grain Full", "小满"),
    MZ(6, "Grain in Ear", "芒种"),
    XS(7, "Minor Heat", "小暑"),
    DS(8, "Major Heat", "大暑"),
    CS(9, "Limit of Heat", "处暑"),
    BL(10, "White Dew", "白露"),
    HL(11, "Cold Dew", "寒露"),
    SJ(12, "Frost's Descent", "霜降"),
    XX(13, "Minor Snow", "小雪"),
    DX(14, "Major Snow", "大雪"),
    XH(15, "Minor Cold", "小寒"),
    DH(16, "Major Cold", "大寒");

    private final int id;
    private final String name;
    private final String label;
}
