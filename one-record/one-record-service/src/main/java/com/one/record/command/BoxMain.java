package com.one.record.command;

import com.one.record.ball.BlueBox;
import com.one.record.ball.RedBox;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

public class BoxMain {

    public static void main(String[] args) {
        box();
    }

    public static void box() {
        // 红色球1～33，每期抽中6个
        RedBox.one();
        // 蓝色球1～16，每期抽中1个
        BlueBox.one();
    }

    public static void count() {
        Map<Integer, AtomicInteger> b = new HashMap<>();
        for (int i = 0; i < 7; i++) {
            b.put(i, new AtomicInteger());
        }
        Map<String, AtomicInteger> c = new HashMap<>();

        Map<Integer, AtomicInteger> a = new HashMap<>();
        for (int i = 21; i < 184; i++) {
            a.put(i, new AtomicInteger());
        }
        Map<Integer, Map<String, AtomicInteger>> d = new HashMap<>();
        for (int i = 21; i < 184; i++) {
            d.put(i, new HashMap<>());
        }
        for (int i = 1; i < 29; i++) {
            int i1 = i % 2;
            for (int j = i + 1; j < 30; j++) {
                int j1 = j % 2;
                for (int k = j + 1; k < 31; k++) {
                    int k1 = k % 2;
                    for (int l = k + 1; l < 32; l++) {
                        int l1 = l % 2;
                        for (int m = l + 1; m < 33; m++) {
                            int m1 = m % 2;
                            for (int n = m + 1; n < 34; n++) {
                                int n1 = n % 2;

                                int sumB = i1 + j1 + k1 + l1 + m1 + n1;
                                b.get(sumB).incrementAndGet();

                                String sumC = "" + i1 + j1 + k1 + l1 + m1 + n1;
                                if (!c.containsKey(sumC)) {
                                    c.put(sumC, new AtomicInteger());
                                }
                                c.get(sumC).incrementAndGet();

                                int sumA = i + j + k + l + m + n;
                                a.get(sumA).incrementAndGet();

                                Map<String, AtomicInteger> sumD = d.get(sumA);
                                if (!sumD.containsKey(sumC)) {
                                    sumD.put(sumC, new AtomicInteger());
                                }
                                sumD.get(sumC).incrementAndGet();
                            }
                        }
                    }
                }
            }
        }
        int sumA = a.values().stream().mapToInt(AtomicInteger::intValue).sum();
        int sumB = b.values().stream().mapToInt(AtomicInteger::intValue).sum();
        int sumC = c.values().stream().mapToInt(AtomicInteger::intValue).sum();
        System.out.println(sumA + ", " + sumB + ", " + sumC);
        a.forEach((k, v) -> System.out.println(k + ":" + v));
        b.forEach((k, v) -> System.out.println(k + ":" + v));
        c.forEach((k, v) -> System.out.println(k + ":" + v));
        d.forEach((k, v) -> System.out.println(k + ":" + v));
    }
}
