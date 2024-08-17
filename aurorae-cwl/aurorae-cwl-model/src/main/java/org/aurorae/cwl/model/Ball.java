package org.aurorae.cwl.model;

import lombok.*;
import org.aurorae.common.enums.IBall;
import org.aurorae.common.util.StreamUtil;

import java.util.ArrayList;
import java.util.List;
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

    private int count;

    private List<BallRate> rates = new ArrayList<>();

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

    public void increase() {
        this.count++;
    }

    public void rate(int i, long ratio) {
        this.rates.add(BallRate.one(i, this.count, ratio));
    }
}
