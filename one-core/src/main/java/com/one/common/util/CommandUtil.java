package com.one.common.util;

import java.util.Arrays;

public class CommandUtil {

    public static boolean hasArg(String arg, String... args) {
        return args != null
                && args.length > 0
                && Arrays.asList(args).contains(arg);
    }
}
