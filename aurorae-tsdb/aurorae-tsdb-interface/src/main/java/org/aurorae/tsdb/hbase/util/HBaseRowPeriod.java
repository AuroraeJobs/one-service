package org.aurorae.tsdb.hbase.util;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum HBaseRowPeriod {

    // second
    s1(1), s2(2), s5(3), s10(4), s15(5), s20(6), s30(7),

    // minute
    m1(11), m2(12), m5(13), m10(14), m15(15), m20(16), m30(17),

    // hour
    h1(21), h2(22), h3(23), h6(24), h12(25),

    // day
    d1(31), d2(32), d3(33),

    // week
    w1(34),

    // Month
    M1(41), M6(43),

    // quarter
    q1(42),

    // year
    y1(51), y2(52)
    ;

    private final int id;
    
    public boolean littleThanOneHour() {
        // 小时以下的都按月存
        return this.id < HBaseRowPeriod.h1.id;
    }
}
