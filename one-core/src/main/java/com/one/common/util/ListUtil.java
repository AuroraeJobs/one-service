package com.one.common.util;

import java.util.List;

public class ListUtil {

    public static <T> List<T> merge(List<T> l1, List<T> l2) {
        l1.addAll(l2);
        return l1;
    }
}
