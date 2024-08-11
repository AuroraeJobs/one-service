package org.aurorae.common.util;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class StreamUtil {

    public static <T> String joining(List<T> ts,
                                     Function<T, String> mapper,
                                     CharSequence delimiter,
                                     CharSequence prefix,
                                     CharSequence suffix) {
        if (ts == null) {
            return null;
        }
        try (Stream<T> stream = ts.stream()) {
            return stream.map(mapper).collect(Collectors.joining(delimiter, prefix, suffix));
        }
    }

    public static <T, R> List<R> toList(List<T> ts,
                                        Function<T, R> mapper) {
        if (ts == null) {
            return null;
        }
        try (Stream<T> stream = ts.stream()) {
            return stream.map(mapper).collect(Collectors.toList());
        }
    }

    public static <T, R> List<R> flatList(List<T> ts,
                                        Function<T, List<R>> mapper) {
        if (ts == null) {
            return null;
        }
        try (Stream<T> stream = ts.stream()) {
            return stream.map(mapper).filter(Objects::nonNull).flatMap(Collection::stream).collect(Collectors.toList());
        }
    }

    public static <T, K, V> Map<K, V> toMap(Collection<T> ts,
                                            Function<T, K> keyMapper,
                                            Function<T, V> valueMapper) {
        if (ts == null) {
            return null;
        }
        try (Stream<T> stream = ts.stream()) {
            return stream.collect(Collectors.toMap(keyMapper, valueMapper, (v1, v2) -> v1));
        }
    }

    public static <T, K, V> Map<K, V> toMap(T[] ts,
                                            Function<T, K> keyMapper,
                                            Function<T, V> valueMapper) {
        if (ts == null) {
            return null;
        }
        try (Stream<T> stream = Arrays.stream(ts)) {
            return stream.collect(Collectors.toMap(keyMapper, valueMapper, (v1, v2) -> v1));
        }
    }

    public static <T, K> Map<K, Long> groupingByCounting(List<T> ts,
                                                         Function<T, K> keyMapper) {
        if (ts == null) {
            return null;
        }
        try (Stream<T> stream = ts.stream()) {
            return stream.collect(Collectors.groupingBy(keyMapper, Collectors.counting()));
        }
    }
}
