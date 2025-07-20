package org.aurorae.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Weapons {

    /**
     * 九朝+春秋战国时期+三国时期+魏晋南北朝时期+五胡十六国时期+五代十国时期
     */
    XC("01", "夏朝"),
    SC("02", "商朝"),
    ZC("03", "周朝"),
    CQ("04", "春秋"),
    ZG("05", "战国"),
    QC("06", "秦朝"),
    HC("07", "汉朝"),
    SG("08", "三国"),
    JC("09", "晋朝"),
    WH("10", "五胡"),
    NC("11", "南朝"),
    BC("12", "北朝"),
    SU("13", "隋朝"),
    TC("14", "唐朝"),
    WD("15", "五代"),
    SO("16", "宋朝"),
    YC("17", "元朝"),
    MC("18", "明朝"),
    QI("19", "清朝");

    private final String id;
    private final String name;
}
