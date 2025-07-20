package org.aurorae.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Weather {

    /**
     * 二十四 节气是中国古代农业文明的产物，
     * 根据太阳在黄道上的位置变化而划分的一种时间知识体系，用来指导农事活动。
     * 这一体系将一年分为二十四个节气，每个节气大约15天，反映了一年中的气候变化和季节转换。
     */
    LC("01", "立春"),
    YS("02", "雨水"),
    JZ("03", "惊蛰"),
    CF("04", "春分"),
    QM("05", "清明"),
    GY("06", "谷雨"),
    LX("07", "立夏"),
    XM("08", "小满"),
    MZ("09", "芒种"),
    XZ("10", "夏至"),
    XS("11", "小暑"),
    DS("12", "大暑"),
    LQ("13", "立秋"),
    CS("14", "处暑"),
    BL("15", "白露"),
    QF("16", "秋分"),
    HL("17", "寒露"),
    SJ("18", "霜降"),
    LD("19", "立冬"),
    XX("20", "小雪"),
    DX("21", "大雪"),
    DZ("22", "冬至"),
    XH("23", "小寒"),
    DH("24", "大寒");

    private final String id;
    private final String name;
}
