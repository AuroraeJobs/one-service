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
    YS("01", "雨水", "刀"),
    JC("02", "惊蛰", "枪"),
    QM("03", "清明", "剑"),
    GY("04", "谷雨", "戟"),
    XM("05", "小满", "斧"),
    MZ("06", "芒种", "钺"),
    XS("07", "小暑", "钩"),
    DS("08", "大暑", "叉"),
    CS("09", "处暑", "镗"),
    BL("10", "白露", "槊"),
    HL("11", "寒露", "棍"),
    SJ("12", "霜降", "棒"),
    XX("13", "小雪", "鞭"),
    DX("14", "大雪", "锏"),
    XH("15", "小寒", "锤"),
    DH("16", "大寒", "抓");

    private final String id;
    private final String name;
    private final String label;
}
