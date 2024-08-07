package org.aurorae.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
@AllArgsConstructor
public enum Province {

    BJ(0, "北京", "京"),
    TJ(1, "天津", "津"),
    HEB(2, "河北", "冀"),
    SX(3, "山西", "晋"),
    NMG(4, "内蒙古", "蒙"),
    // 东三省
    LN(5, "辽宁", "辽"),
    JL(6, "吉林", "吉"),
    HLJ(7, "黑龙江", "黑"),
    // 江浙沪
    SH(8, "上海", "沪"),
    JS(9, "江苏", "苏"),
    ZJ(10, "浙江", "浙"),
    FJ(12, "福建", "闽"),
    JX(13, "江西", "赣"),
    // 鲁豫
    AH(11, "安徽", "皖"),
    SD(14, "山东", "鲁"),
    HEN(15, "河南", "豫"),
    // 湘鄂
    HUB(16, "湖北", "鄂"),
    HUN(17, "湖南", "湘"),
    GD(18, "广东", "粤"),
    GX(19, "广西", "桂"),
    HN(20, "海南", "琼"),
    // 川渝
    CQ(21, "重庆", "渝"),
    SC(22, "四川", "川"),
    // 云贵
    GZ(23, "贵州", "黔"),
    YN(24, "云南", "滇"),
    XZ(25, "西藏", "藏"),
    // 陕甘宁
    SHX(26, "陕西", "陕"),
    GS(27, "甘肃", "甘"),
    QH(28, "青海", "青"),
    NX(29, "宁夏", "宁"),
    XJ(30, "新疆", "新"),
    // 港澳台
    TW(31, "台湾", "台"),
    XG(32, "香港", "港"),
    AM(33, "澳门", "澳");

    private final int id;
    private final String name;
    private final String label;

    public static Map<Integer, String> labelMap() {
        return Arrays.stream(values()).collect(Collectors.toMap(
                Province::getId,
                Province::getLabel
        ));
    }
}
