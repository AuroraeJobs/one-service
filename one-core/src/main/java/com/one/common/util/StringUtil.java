package com.one.common.util;

import org.springframework.util.ObjectUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class StringUtil {

    public static boolean isEmpty(Object o) {
        return ObjectUtils.isEmpty(o) || isEmpty(trimOf(o));
    }

    public static boolean isNotEmpty(Object o) {
        return !isEmpty(o);
    }

    public static boolean isEmpty(String s) {
        return s == null || s.trim().isEmpty();
    }

    public static boolean isNotEmpty(String s) {
        return !isEmpty(s);
    }

    public static String fromInputStream(InputStream in) throws IOException {
        StringBuilder out = new StringBuilder();
        byte[] b = new byte[4096];
        for (int n; (n = in.read(b)) != -1; ) {
            out.append(new String(b, 0, n, StandardCharsets.UTF_8));
        }
        in.close();
        return out.toString();
    }

    /**
     * 获得一个字符串
     */
    public static String match(String str, String pattern) {
        Pattern p = Pattern.compile(pattern);
        Matcher m = p.matcher(str);
        while (m.find()) {
            return m.group(1);
        }
        return null;
    }

    public static List<Long> splitId(String ids) {
        return splitId(ids, ",");
    }

    public static List<Long> splitId(String ids, String split) {
        return Arrays.stream(ids.split(split))
                .filter(StringUtil::isNotEmpty)
                .map(Long::parseLong)
                .collect(Collectors.toList());
    }

    public static String trimOf(Object o) {
        return o != null ? o.toString().trim() : null;
    }

    public static String trimOf(String s) {
        return s != null ? s.trim() : null;
    }

    public static List<String> a2z() {
        return Stream.iterate('a', i -> (char) (i + 1)).limit('z' - 'a' + 1).map(Object::toString).collect(Collectors.toList());
    }

    public static List<String> A2Z() {
        // #ABCDEFGHILKMNOPQRSTUVWXYZ
        return Stream.iterate('A', i -> (char) (i + 1)).limit('Z' - 'A' + 1).map(Object::toString).collect(Collectors.toList());
    }

    public static List<String> matchList(String str, String pattern) {
        List<String> strs = new ArrayList<>();
        Pattern p = Pattern.compile(pattern);
        Matcher m = p.matcher(str);
        while (m.find()) {
            for (int i = 1; i <= m.groupCount(); i++) {
                strs.add(m.group(i));
            }
        }
        return strs;
    }
}
