package com.one.record.ball;

import com.one.common.util.StreamUtil;

import java.util.*;
import java.util.stream.Collectors;

public class BoxFly {

    private final Map<Integer, List<String>> fly = new HashMap<>();

    public void flyBall(Ball ball) {
        this.fly.computeIfAbsent(ball.getCount(), k -> new ArrayList<>()).add(ball.getId());
    }

    public void issue(int issue, Collection<Ball> hit, int ballSize) {
        StreamUtil.forEach(hit, this::flyBall);
        this.fly.entrySet()
                .stream()
                .filter(entry -> entry.getValue().size() == ballSize)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList())
                .forEach(i -> System.out.println(i + ": " + this.fly.remove(i)));
    }

    public void print() {
        this.fly.forEach((i, ss) -> System.out.println(i + ": " + ss));
    }
}
