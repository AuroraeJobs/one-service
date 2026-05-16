package org.aurorae.record.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ChargeLocation {

    TLD001(ChargeProvider.TELEMATICS, "苏州冰厂街公交首末站西侧停车场充电站", "tld001"),
    TLD002(ChargeProvider.TELEMATICS, "河南交投连霍高速宁陵服务区（连云港方向）", "tld002"),
    TLD003(ChargeProvider.TELEMATICS, "河南交投盐洛高速永城南服务区（洛阳方向）", "tld003"),
    TLD004(ChargeProvider.TELEMATICS, "上海红星美凯龙沪南路店充电站", "tld004"),
    TLD005(ChargeProvider.TELEMATICS, "上海顾戴路特来电充电站", "tld005"),
    TLD006(ChargeProvider.TELEMATICS, "上海迪士尼P2停车场充电站", "tld006"),

    YSC2666(ChargeProvider.HUAWEI, "悦速充中春路2666号超充站", "ysc2666"),

    NAT001(ChargeProvider.NATIONAL_GRID, "高速服务区", "nat001"),
    ;

    private final ChargeProvider provider;
    private final String label;
    private final String value;

    public static ChargeLocation fromValue(String value) {
        for (ChargeLocation location : values()) {
            if (location.getValue().equals(value)) {
                return location;
            }
        }
        return null;
    }

    public static ChargeLocation fromLabel(String label) {
        for (ChargeLocation location : values()) {
            if (location.getLabel().equals(label)) {
                return location;
            }
        }
        return null;
    }
}
