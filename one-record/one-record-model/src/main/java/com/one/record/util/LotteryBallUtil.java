package com.one.record.util;

import java.util.HashMap;
import java.util.Map;

public final class LotteryBallUtil {

    private static final Map<Integer, String> RED_PLANET = new HashMap<>();

    private static final Map<String, String> HEXAGRAM = new HashMap<>();

    static {
        RED_PLANET.put(6, "天王星");
        RED_PLANET.put(5, "土星");
        RED_PLANET.put(4, "木星");
        RED_PLANET.put(3, "火星");
        RED_PLANET.put(2, "金星");
        RED_PLANET.put(1, "水星");
        RED_PLANET.put(0, "地球");

        HEXAGRAM.put("111111", "乾");
        HEXAGRAM.put("111110", "夬");
        HEXAGRAM.put("111101", "大有");
        HEXAGRAM.put("111100", "大壮");
        HEXAGRAM.put("111011", "小畜");
        HEXAGRAM.put("111010", "需");
        HEXAGRAM.put("111001", "大畜");
        HEXAGRAM.put("111000", "泰");
        HEXAGRAM.put("110111", "履");
        HEXAGRAM.put("110110", "兑");
        HEXAGRAM.put("110101", "睽");
        HEXAGRAM.put("110100", "归妹");
        HEXAGRAM.put("110011", "中孚");
        HEXAGRAM.put("110010", "节");
        HEXAGRAM.put("110001", "损");
        HEXAGRAM.put("110000", "临");
        HEXAGRAM.put("101111", "同人");
        HEXAGRAM.put("101110", "革");
        HEXAGRAM.put("101101", "离");
        HEXAGRAM.put("101100", "丰");
        HEXAGRAM.put("101011", "家人");
        HEXAGRAM.put("101010", "既济");
        HEXAGRAM.put("101001", "贲");
        HEXAGRAM.put("101000", "明夷");
        HEXAGRAM.put("100111", "无妄");
        HEXAGRAM.put("100110", "随");
        HEXAGRAM.put("100101", "噬嗑");
        HEXAGRAM.put("100100", "震");
        HEXAGRAM.put("100011", "益");
        HEXAGRAM.put("100010", "屯");
        HEXAGRAM.put("100001", "颐");
        HEXAGRAM.put("100000", "复");
        HEXAGRAM.put("011111", "姤");
        HEXAGRAM.put("011110", "大过");
        HEXAGRAM.put("011101", "鼎");
        HEXAGRAM.put("011100", "恒");
        HEXAGRAM.put("011011", "巽");
        HEXAGRAM.put("011010", "井");
        HEXAGRAM.put("011001", "蛊");
        HEXAGRAM.put("011000", "升");
        HEXAGRAM.put("010111", "讼");
        HEXAGRAM.put("010110", "困");
        HEXAGRAM.put("010101", "未济");
        HEXAGRAM.put("010100", "解");
        HEXAGRAM.put("010011", "涣");
        HEXAGRAM.put("010010", "坎");
        HEXAGRAM.put("010001", "蒙");
        HEXAGRAM.put("010000", "师");
        HEXAGRAM.put("001111", "遁");
        HEXAGRAM.put("001110", "咸");
        HEXAGRAM.put("001101", "旅");
        HEXAGRAM.put("001100", "小过");
        HEXAGRAM.put("001011", "渐");
        HEXAGRAM.put("001010", "蹇");
        HEXAGRAM.put("001001", "艮");
        HEXAGRAM.put("001000", "谦");
        HEXAGRAM.put("000111", "否");
        HEXAGRAM.put("000110", "萃");
        HEXAGRAM.put("000101", "晋");
        HEXAGRAM.put("000100", "豫");
        HEXAGRAM.put("000011", "观");
        HEXAGRAM.put("000010", "比");
        HEXAGRAM.put("000001", "剥");
        HEXAGRAM.put("000000", "坤");
    }

    private LotteryBallUtil() {
    }

    public static String redPlanet(String... balls) {
        return RED_PLANET.getOrDefault(oddCount(balls), "地球");
    }

    public static String redHexagram(String... balls) {
        return HEXAGRAM.getOrDefault(hexagramCode(balls), "坤");
    }

    public static String bluePlanet(String ball) {
        return isOdd(ball) ? "太阳" : "月亮";
    }

    public static String blueHexagram(String ball) {
        return isOdd(ball) ? "阳" : "阴";
    }

    private static String hexagramCode(String... balls) {
        StringBuilder code = new StringBuilder();
        for (String ball : balls) {
            code.append(isOdd(ball) ? "1" : "0");
        }
        return code.toString();
    }

    private static int oddCount(String... balls) {
        int count = 0;
        for (String ball : balls) {
            if (isOdd(ball)) {
                count++;
            }
        }
        return count;
    }

    private static boolean isOdd(String ball) {
        return Integer.parseInt(ball) % 2 != 0;
    }
}
