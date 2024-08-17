package org.aurorae.cwl.model;

import lombok.*;
import org.aurorae.common.enums.IBall;
import org.aurorae.common.util.StreamUtil;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ball implements IBall {

    private int id;

    private String name;

    private String label;

    // 出现几次的所在期数
    private Map<Integer, Integer> counts = new HashMap<>();

    // 每期出现次数的比率
    private Map<Integer, Double> rates = new HashMap<>();

    public Ball(int id, String name, String label) {
        this.id = id;
        this.name = name;
        this.label = label;
    }

    public static Ball one(int id, String name, String label) {
        return new Ball(id, name, label);
    }

    public static <B extends IBall> Function<B, Ball> ballOf() {
        return ball -> Ball.one(ball.getId(), ball.getName(), ball.getLabel());
    }

    public static Map<Integer, Ball> toMap(IBall[] balls) {
        return StreamUtil.toMap(balls, IBall::getId, Ball.ballOf());
    }

    public void increase(int i) {
        this.counts.put(this.counts.size() + 1, i);
    }

    public void rate(int i) {
        this.rates.put(i, BigDecimal.valueOf(this.counts.size()).divide(BigDecimal.valueOf(i * 6L), 6, RoundingMode.HALF_UP).doubleValue());
    }
}
