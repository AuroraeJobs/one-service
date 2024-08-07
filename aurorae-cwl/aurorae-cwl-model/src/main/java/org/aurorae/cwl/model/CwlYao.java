package org.aurorae.cwl.model;

import lombok.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
public class CwlYao extends CwlObject {

    private int is1;
    private int is2;
    private int is3;
    private int is4;
    private int is5;
    private int is6;
    private int is7;
    private int is8;
    private int is9;
    private int is10;
    private int is11;
    private int is12;
    private int is13;
    private int is14;
    private int is15;
    private int is16;
    private int is17;
    private int is18;
    private int is19;
    private int is20;
    private int is21;
    private int is22;
    private int is23;
    private int is24;
    private int is25;
    private int is26;
    private int is27;
    private int is28;
    private int is29;
    private int is30;
    private int is31;
    private int is32;
    private int is33;

    public int getSum() {
        return is1 + is2 + is3 + is4 + is5 + is6 + is7 + is8 + is9 + is10 + is11 + is12 + is13 + is14 + is15 + is16 + is17 + is18 + is19 + is20 + is21 + is22 + is23 + is24 + is25 + is26 + is27 + is28 + is29 + is30 + is31 + is32 + is33;
    }

    /**
     * 所有的数字，是否均已经出现了（n + 1）次
     *
     * @param n 已经出现的最少次数
     * @return 是/否
     */
    public boolean min(int n) {
        return getList().stream().min(Integer::compareTo).orElse(0) >= n;
    }

    /**
     * 是否有数字已经出现了（n + 1）次
     *
     * @param n 已经出现的最大次数
     * @return 是/否
     */
    public boolean max(int n) {
        return getList().stream().max(Integer::compareTo).orElse(0) >= n;
    }

    public List<Integer> getList() {
        return Arrays.asList(is1, is2, is3, is4, is5, is6, is7, is8, is9, is10, is11, is12, is13, is14, is15, is16, is17, is18, is19, is20, is21, is22, is23, is24, is25, is26, is27, is28, is29, is30, is31, is32, is33);
    }

    public Map<Integer, Integer> getMap() {
        Map<Integer, Integer> map = new HashMap<>();
        map.put(1, is1);
        map.put(2, is2);
        map.put(3, is3);
        map.put(4, is4);
        map.put(5, is5);
        map.put(6, is6);
        map.put(7, is7);
        map.put(8, is8);
        map.put(9, is9);
        map.put(10, is10);
        map.put(11, is11);
        map.put(12, is12);
        map.put(13, is13);
        map.put(14, is14);
        map.put(15, is15);
        map.put(16, is16);
        map.put(17, is17);
        map.put(18, is18);
        map.put(19, is19);
        map.put(20, is20);
        map.put(21, is21);
        map.put(22, is22);
        map.put(23, is23);
        map.put(24, is24);
        map.put(25, is25);
        map.put(26, is26);
        map.put(27, is27);
        map.put(28, is28);
        map.put(29, is29);
        map.put(30, is30);
        map.put(31, is31);
        map.put(32, is32);
        map.put(33, is33);
        return map;
    }

    public int health() {
        return health(getList());
    }

    public int health(List<Integer> list) {
        return list.stream().max(Integer::compareTo).map(max -> list.stream().mapToInt(i -> (max - i)).sum()).orElse(0);
    }

    public int healthPrint(List<Integer> list) {
        Integer max = list.stream().max(Integer::compareTo).orElse(0);
        System.out.println("max: " + max);
        list.forEach(i -> System.out.println(i + ": " + (max - i)));
        return list.stream().mapToInt(i -> (max - i)).sum();
    }

    public int count(int num) {
        int pr = 0;
        switch (num) {
            case 1:
                pr = this.is1;
                break;
            case 2:
                pr = this.is2;
                break;
            case 3:
                pr = this.is3;
                break;
            case 4:
                pr = this.is4;
                break;
            case 5:
                pr = this.is5;
                break;
            case 6:
                pr = this.is6;
                break;
            case 7:
                pr = this.is7;
                break;
            case 8:
                pr = this.is8;
                break;
            case 9:
                pr = this.is9;
                break;
            case 10:
                pr = this.is10;
                break;
            case 11:
                pr = this.is11;
                break;
            case 12:
                pr = this.is12;
                break;
            case 13:
                pr = this.is13;
                break;
            case 14:
                pr = this.is14;
                break;
            case 15:
                pr = this.is15;
                break;
            case 16:
                pr = this.is16;
                break;
            case 17:
                pr = this.is17;
                break;
            case 18:
                pr = this.is18;
                break;
            case 19:
                pr = this.is19;
                break;
            case 20:
                pr = this.is20;
                break;
            case 21:
                pr = this.is21;
                break;
            case 22:
                pr = this.is22;
                break;
            case 23:
                pr = this.is23;
                break;
            case 24:
                pr = this.is24;
                break;
            case 25:
                pr = this.is25;
                break;
            case 26:
                pr = this.is26;
                break;
            case 27:
                pr = this.is27;
                break;
            case 28:
                pr = this.is28;
                break;
            case 29:
                pr = this.is29;
                break;
            case 30:
                pr = this.is30;
                break;
            case 31:
                pr = this.is31;
                break;
            case 32:
                pr = this.is32;
                break;
            case 33:
                pr = this.is33;
                break;
        }
        return pr;
    }

    public void incr(int num) {
        switch (num) {
            case 1:
                this.is1 += 1;
                break;
            case 2:
                this.is2 += 1;
                break;
            case 3:
                this.is3 += 1;
                break;
            case 4:
                this.is4 += 1;
                break;
            case 5:
                this.is5 += 1;
                break;
            case 6:
                this.is6 += 1;
                break;
            case 7:
                this.is7 += 1;
                break;
            case 8:
                this.is8 += 1;
                break;
            case 9:
                this.is9 += 1;
                break;
            case 10:
                this.is10 += 1;
                break;
            case 11:
                this.is11 += 1;
                break;
            case 12:
                this.is12 += 1;
                break;
            case 13:
                this.is13 += 1;
                break;
            case 14:
                this.is14 += 1;
                break;
            case 15:
                this.is15 += 1;
                break;
            case 16:
                this.is16 += 1;
                break;
            case 17:
                this.is17 += 1;
                break;
            case 18:
                this.is18 += 1;
                break;
            case 19:
                this.is19 += 1;
                break;
            case 20:
                this.is20 += 1;
                break;
            case 21:
                this.is21 += 1;
                break;
            case 22:
                this.is22 += 1;
                break;
            case 23:
                this.is23 += 1;
                break;
            case 24:
                this.is24 += 1;
                break;
            case 25:
                this.is25 += 1;
                break;
            case 26:
                this.is26 += 1;
                break;
            case 27:
                this.is27 += 1;
                break;
            case 28:
                this.is28 += 1;
                break;
            case 29:
                this.is29 += 1;
                break;
            case 30:
                this.is30 += 1;
                break;
            case 31:
                this.is31 += 1;
                break;
            case 32:
                this.is32 += 1;
                break;
            case 33:
                this.is33 += 1;
                break;
        }
    }
}
