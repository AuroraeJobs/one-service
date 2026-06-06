package com.one.record.ball;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class BoxOrder {

    private final List<String> balls = new ArrayList<>();

    public static BoxOrder one() {
        return new BoxOrder();
    }

    public void move(String element) {
        // 把最新出现的移到最前面
        this.balls.remove(element);
        this.balls.add(0, element);
    }
}
