package org.aurorae.flink.util;

import java.util.*;

public class Generator {


    private int MON;
    private int TUE;
    private int WED;
    private int THU;
    private int FRI;
    private int SAT;
    private int SUN;

    private final List<Integer> REDS;

    public Generator() {
        TreeSet<Integer> hits = new TreeSet<>();
        SplittableRandom RANDOM = new SplittableRandom();
        while (hits.size() != 6) {
            hits.add(RANDOM.nextInt(1, 33));
        }
        Optional.ofNullable(hits.pollFirst()).ifPresent(integer -> MON = integer);
        Optional.ofNullable(hits.pollFirst()).ifPresent(integer -> TUE = integer);
        Optional.ofNullable(hits.pollFirst()).ifPresent(integer -> WED = integer);
        Optional.ofNullable(hits.pollFirst()).ifPresent(integer -> THU = integer);
        Optional.ofNullable(hits.pollFirst()).ifPresent(integer -> FRI = integer);
        Optional.ofNullable(hits.pollFirst()).ifPresent(integer -> SAT = integer);
        REDS = Arrays.asList(MON, TUE, WED, THU, FRI, SAT);
        SUN = RANDOM.nextInt(1, 16);
    }

    public void print() {
        String format = String.format("Monday:[%s],Tuesday:[%s],Wednesday[%s],Thursday[%s],Friday:[%s],Saturday:[%s],Sunday:[%s]", MON, TUE, WED, THU, FRI, SAT, SUN);
        System.out.println(format);
    }

    public static void main(String[] args) {
        Generator generator = new Generator();
        System.out.println(generator.REDS + ":" + generator.SUN);
    }
}
