package org.aurorae.common.util;

import java.util.List;
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

    public static <T, R> List<R> mapper(List<T> ts, Function<T, R> mapper) {
        if (ts == null) {
            return null;
        }
        try (Stream<T> stream = ts.stream()) {
            return stream.map(mapper).collect(Collectors.toList());
        }
    }
}
