package org.aurorae.record.command;

import org.aurorae.record.ball.BlueBox;
import org.aurorae.record.ball.IBox;
import org.aurorae.record.ball.RedBox;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

public class BoxMain {

    public static void main(String[] args) {
        box();
    }

    public static void box() {
        // 红色球1～33，每期抽中6个
        IBox.box(RedBox.one(), "red");
        // 蓝色球1～16，每期抽中1个
        IBox.box(BlueBox.one(), "blue");
    }

    public static void count() {
        Map<Integer, AtomicInteger> counter = new HashMap<>();
        for (int i = 21; i <= 183; i++) {
            counter.put(i, new AtomicInteger());
        }
        for (int i = 1; i <= 28; i++) {
            for (int j = i +  1; j <= 29; j++) {
                for (int k = j + 1; k <= 30; k++) {
                    for (int l = k + 1; l <= 31; l++) {
                        for (int m = l + 1; m <= 32; m++) {
                            for (int n = m + 1; n <= 33; n++) {
                                int count = i + j + k + l + m + n;
                                counter.get(count).incrementAndGet();
                            }
                        }
                    }
                }
            }
        }
        int count = counter.values().stream().mapToInt(AtomicInteger::intValue).sum();
        System.out.println(count);
        counter.forEach((k, v) -> System.out.println(k + ": " + v.get()));
    }
}
