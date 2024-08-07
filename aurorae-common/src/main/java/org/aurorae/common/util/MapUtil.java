package org.aurorae.common.util;

import java.util.*;
import java.util.stream.Collectors;

public class MapUtil {

    public static List<Map.Entry<Integer, Integer>> sortByValueReverse(Map<Integer, Integer> map) {
        return map.entrySet().stream().sorted(Map.Entry.comparingByValue(Comparator.reverseOrder())).collect(Collectors.toList());
    }

    public static List<Map.Entry<Integer, Integer>> sortByValue(Map<Integer, Integer> map) {
        return map.entrySet().stream().sorted(Map.Entry.comparingByValue()).collect(Collectors.toList());
    }

    public static List<Map<Integer, Integer>> entryKVToMap(List<Map.Entry<Integer, Integer>> entries) {
        // 这里会把key，value分成两个map
        // 两个map的key是从0开始的序号
        Map<Integer, Integer> key = new HashMap<>();
        Map<Integer, Integer> value = new HashMap<>();
        for (int i = 0; i < entries.size(); i++) {
            Map.Entry<Integer, Integer> entry = entries.get(i);
            key.put(i, entry.getKey());
            value.put(i, entry.getValue());
        }
        return Arrays.asList(key, value);
    }

    public static List<Map<Integer, Integer>> mapList(Map<Integer, Integer> map) {
        return entryKVToMap(sortByValue(map));
    }
}
