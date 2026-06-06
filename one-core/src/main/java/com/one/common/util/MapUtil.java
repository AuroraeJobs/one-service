package com.one.common.util;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.BiFunction;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;

public class MapUtil {
    /**
     * （Map.putAll方法，对于值是map类型的情况，只能整个替换值map，不能将两个值map里的key，value取并集）所以写此方法
     * target和source取并集，当两个map中有相同key时，用source中的值覆盖target中的值
     * 如果值是map，则重复上述过程，直到替换map的值替换完毕
     * 取交集并替换之后，值存在target中
     * @param target
     * @param source
     */
    public static void joinMap(Map<String,Object> target,Map<String,Object> source){
        Set<Map.Entry<String,Object>> set = source.entrySet();
        for(Map.Entry<String, Object> entry: set){
            String key = entry.getKey();
            Object value = entry.getValue();
            if(value instanceof Map && target.get(key) instanceof Map){//如果是map类型，则应该把map的值替换
                joinMap((Map)target.get(key),(Map)value);
                value = (Map)target.get(key);
            }
            target.put(key,value);
        }
    }

    public static <K, V> void setLongValue(Map<K, V> map, K k, Consumer<Long> setter) {
        setValue(map, k, LongUtil::parseLong, setter);
    }

    public static <K, V> void setStringValue(Map<K, V> map, K k, Consumer<String> setter) {
        setValue(map, k, String::valueOf, setter);
    }

    public static <K, V, R> void setValue(Map<K, V> map, K k, Function<Object, R> parse, Consumer<R> setter) {
        Optional.ofNullable(getValue(map, k, parse)).ifPresent(setter);
    }

    public static <K, V> Long getLongValue(Map<K, V> map, K k) {
        return getValue(map, k, LongUtil::parseLong);
    }

    public static <K, V, R> R getValue(Map<K, V> map, K k, Function<Object, R> parse) {
        return Optional.ofNullable(map)
                .map(m -> m.get(k))
                .map(parse)
                .orElse(null);
    }

    public static <H, HK, HV> HV getValue(Map<H, Map<HK, HV>> map, H key, HK hashKey) {
        return Optional.ofNullable(map.get(key))
                .map(values -> values.get(hashKey))
                .orElse(null);
    }

    public static <H, HK, HV> void mergeValue(Map<H, Map<HK, HV>> map, H key, HK hashKey, HV value, BiFunction<? super HV, ? super HV, ? extends HV> remappingFunction) {
        Map<HK, HV> hmap = Optional.ofNullable(map.get(key))
                .orElseGet(HashMap::new);
        hmap.merge(hashKey, value, remappingFunction);
        map.putIfAbsent(key, hmap);
    }

    public static <H, HK, HV> void putValue(Map<H, Map<HK, HV>> map, H key, HK hashKey, HV value) {
        Map<HK, HV> hmap = Optional.ofNullable(map.get(key))
                .orElseGet(ConcurrentHashMap::new);
        hmap.put(hashKey, value);
        map.putIfAbsent(key, hmap);
    }

    public static <K, V> Map<K, V> putOneValue(Map<K, V> map, K key, Supplier<V> value) {
        return putValue(map, key, value.get());
    }

    public static <K, V> Map<K, V> putValue(Map<K, V> map, K key, V value) {
        map = Optional.ofNullable(map).orElseGet(HashMap::new);
        map.put(key, value);
        return map;
    }

    public static <K, V> Map<K, V> putValue(Map<K, V> map, Map<K, V> kv) {
        map = Optional.ofNullable(map).orElseGet(HashMap::new);
        Optional.ofNullable(kv).ifPresent(map::putAll);
        return map;
    }

    public static <K, V> List<Map<K, V>> toList(Map<K, V[]> tagMap) {
        Iterator<Map.Entry<K, V[]>> iterator = tagMap.entrySet().iterator();
        Map.Entry<K, V[]> first = iterator.next();
        return toList(iterator, first);
    }

    public static <K, V> List<Map<K, V>> toList(Iterator<Map.Entry<K, V[]>> iterator, Map.Entry<K, V[]> entry) {
        return iterator.hasNext() ? merge(entry, toList(iterator, iterator.next())) : toList(entry);
    }

    public static <K, V> List<Map<K, V>> merge(Map.Entry<K, V[]> entry, List<Map<K, V>> mapList) {
        return Arrays.stream(entry.getValue())
                .map(v -> mapList.stream().map(map -> putValue(new HashMap<>(map), entry.getKey(), v)).collect(Collectors.toList()))
                .flatMap(Collection::stream)
                .collect(Collectors.toList());
    }

    public static <K, V> List<Map<K, V>> toList(Map.Entry<K, V[]> entry) {
        return Arrays.stream(entry.getValue()).map(o -> putValue(null, entry.getKey(), o)).collect(Collectors.toList());
    }

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
