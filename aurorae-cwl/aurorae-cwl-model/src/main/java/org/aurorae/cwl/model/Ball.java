package org.aurorae.cwl.model;

import lombok.*;
import org.aurorae.common.enums.IBall;
import org.aurorae.common.util.StreamUtil;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ball implements IBall {

    private String id;

    private String name;

    private String label;

    private int count;

    private List<BallRate> rates = new ArrayList<>();

    public Ball(String id, String name, String label) {
        this.id = id;
        this.name = name;
        this.label = label;
    }

    public static Ball one(String id, String name, String label) {
        return new Ball(id, name, label);
    }

    public static <B extends IBall> Function<B, Ball> ballOf() {
        return ball -> Ball.one(ball.getId(), ball.getName(), ball.getLabel());
    }

    public static Map<String, Ball> toMap(IBall[] balls) {
        return StreamUtil.toMap(balls, IBall::getId, Ball.ballOf());
    }

    public void increase() {
        this.count++;
    }

    public void rate(int i, long ratio) {
        this.rates.add(BallRate.one(i, this.count, ratio));
    }

    public static String sortByCount(Collection<Ball> balls) {
        return sort(balls, Ball::getCount, Ball::getLabel);
    }

    public static String sort(Collection<Ball> balls, Function<Ball, Integer> sort, Function<Ball, String> mapper) {
        try (Stream<Ball> stream = balls.stream()) {
            return stream.sorted(Comparator.comparing(sort)).map(mapper).collect(Collectors.joining());
        }
    }
}
