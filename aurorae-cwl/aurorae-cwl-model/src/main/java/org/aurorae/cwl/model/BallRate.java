package org.aurorae.cwl.model;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Getter
@Setter
public class BallRate {

    /**
     * 期数
     */
    private int id;

    /**
     * 次数
     */
    private long count;

    /**
     * 比率
     */
    private double rate;

    public BallRate(int id, long count, double rate) {
        this.id = id;
        this.count = count;
        this.rate = rate;
    }

    public static BallRate one(int id, long count, long ratio) {
        double rate = BigDecimal.valueOf(count).divide(BigDecimal.valueOf(id * ratio), 6, RoundingMode.HALF_UP).doubleValue();
        return new BallRate(id, count, rate);
    }
}
