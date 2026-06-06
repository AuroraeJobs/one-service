package com.one.record.ball;

import lombok.*;
import com.one.common.util.StreamUtil;
import com.one.record.excel.IColumn;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ball implements IBall, IColumn {

    private int column;

    private String id;

    private String name;

    private String label;

    private int count;

    private double rate;

    public Ball(String id, String name, String label) {
        this.column = Integer.parseInt(id);
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

    public void count() {
        this.count++;
    }

    public void rate(int total) {
        // 出现次数占总次数的比率
        this.rate = BigDecimal.valueOf(this.count).divide(BigDecimal.valueOf(total), 6, RoundingMode.HALF_UP).doubleValue();
    }

    public static String sortByCount(Collection<Ball> balls) {
        // 按出现总数进行排序
        try (Stream<Ball> stream = balls.stream()) {
            return stream.sorted(Comparator.comparing(Ball::getCount)).map(Ball::getLabel).collect(Collectors.joining());
        }
    }

    @Override
    public String getTitle() {
        return this.label;
    }

    public String print() {
        return this.label + " | " + this.count + " | " + this.rate;
    }
}
