package org.aurorae.tsdb.hbase.util;

import org.apache.hadoop.hbase.util.Bytes;

import java.util.Arrays;

public class UidUtil {

    public static byte[] alignBytes(long timestamp, int length) {
        byte[] bytes = Bytes.toBytes(timestamp);
        return UidUtil.alignBytes(bytes, length);
    }

    public static byte[] alignBytes(byte[] src) {
        return alignBytes(src, 8);
    }

    public static byte[] alignBytes(byte[] src, int length) {
        if (src.length == length) {
            return src;
        }
        byte[] dest = new byte[length];
        if (src.length > length) {
            System.arraycopy(src, src.length - length, dest, 0, length);
        } else {
            System.arraycopy(src, 0, dest, length - src.length, src.length);
        }
        return dest;
    }

    public static byte[] newBytes(int length, boolean fill) {
        byte[] bytes = new byte[length];
        if (fill) {
            Arrays.fill(bytes, Byte.MAX_VALUE);
        }
        return bytes;
    }
}
