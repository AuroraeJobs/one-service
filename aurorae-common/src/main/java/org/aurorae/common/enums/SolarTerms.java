package org.aurorae.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum SolarTerms {

    // 二十四 节气是中国古代农业文明的产物，
    // 是根据太阳在黄道上的位置变化而划分的一种时间知识体系，用来指导农事活动。
    // 这一体系将一年分为二十四个节气，每个节气大约15天，反映了一年中的气候变化和季节转换。
    LC(1, "Start of Spring", "立春", "春季的开始"),
    YS(2, "Rain Water", "雨水", "降雨开始，雨量渐增"),
    JC(3, "Awakening of Insects", "惊蛰", "春雷乍动，惊醒了冬眠的动物"),
    CF(4, "Vernal Equinox", "春分", "昼夜平分，春季过半"),
    QM(5, "Clear and Bright", "清明", "天气晴朗，草木繁茂"),
    GY(6, "Grain Rain", "谷雨", "雨生百谷，农作物生长"),
    LX(7, "Start of Summer", "立夏", "夏季的开始"),
    XM(8, "Grain Full", "小满", "农作物开始饱满"),
    MZ(9, "Grain in Ear", "芒种", "有芒的作物开始成熟，可以播种"),
    XZ(10, "Summer Solstice", "夏至", "白昼最长，夏季过半"),
    XS(11, "Minor Heat", "小暑", "天气开始炎热"),
    DS(12, "Major Heat", "大暑", "一年中最热的时期"),
    LQ(13, "Start of Autumn", "立秋", "秋季的开始"),
    CS(14, "Limit of Heat", "处暑", "炎热的夏天结束，天气转凉"),
    BL(15, "White Dew", "白露", "天气转凉，露水变白"),
    QF(16, "Autumn Equinox", "秋分", "昼夜再次平分，秋季过半"),
    HL(17, "Cold Dew", "寒露", "露水寒冷，天气更凉"),
    SJ(18, "Frost's Descent", "霜降", "开始有霜，天气变冷"),
    LD(19, "Start of Winter", "立冬", "冬季的开始"),
    XX(20, "Minor Snow", "小雪", "开始下雪"),
    DX(21, "Major Snow", "大雪", "雪量增大，天气寒冷"),
    DZ(22, "Winter Solstice", "冬至", "白昼最短，冬季过半"),
    XH(23, "Minor Cold", "小寒", "天气寒冷"),
    DH(24, "Major Cold", "大寒", "一年中最冷的时期");

    private final int id;
    private final String name;
    private final String label;
    private final String description;
}
