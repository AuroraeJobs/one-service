package org.aurorae.tsdb.hbase.util;

import org.apache.hadoop.hbase.Cell;
import org.apache.hadoop.hbase.util.Bytes;

public class HBaseCell {

    public static String getQualifier(Cell cell) {
        return toString(cell.getQualifierArray(), cell.getQualifierOffset(), cell.getQualifierLength());
    }

    public static byte[] getQualifierByte(Cell cell) {
        return toBytes(cell.getQualifierArray(), cell.getQualifierOffset(), cell.getQualifierLength(), cell.getQualifierLength());
    }

    public static Long getQualifierLong(Cell cell) {
        return toLong(getQualifierByte(cell));
    }

    public static String getTags(Cell cell) {
        return toString(cell.getTagsArray(), cell.getTagsOffset(), cell.getTagsLength());
    }

    public static String getFamily(Cell cell) {
        return toString(cell.getFamilyArray(), cell.getFamilyOffset(), cell.getFamilyLength());
    }

    public static byte[] getFamilyByte(Cell cell) {
        return toBytes(cell.getFamilyArray(), cell.getFamilyOffset(), cell.getFamilyLength(), cell.getFamilyLength());
    }

    public static String getFamilyCell(Cell cell) {
        return toString(getFamilyByte(cell));
    }

    public static String getRow(Cell cell) {
        return toString(cell.getRowArray(), cell.getRowOffset(), cell.getRowLength());
    }

    public static String getValue(Cell cell) {
        return toString(cell.getValueArray(), cell.getValueOffset(), cell.getValueLength());
    }

    public static byte[] getValueByte(Cell cell) {
        return toBytes(cell.getValueArray(), cell.getValueOffset(), cell.getValueLength(), cell.getValueLength());
    }

    public static String getValueCell(Cell cell) {
        return toString(getValueByte(cell));
    }

    public static String toString(byte[] b, int off, int len) {
        return Bytes.toString(b, off, len);
    }

    public static String toString(byte[] b) {
        return Bytes.toString(b);
    }

    private static Long toLong(byte[] bytes) {
        return Bytes.toLong(bytes);
    }

    public static byte[] toBytes(byte[] src, int srcPos, int length, int allLength) {
        byte[] dest = new byte[allLength];
        int destPos = allLength - length;
        System.arraycopy(src, srcPos, dest, destPos, length);
        return dest;
    }

    public static void copyBytes(final byte[] src, final byte[] dest, final int destPos) {
        System.arraycopy(src, 0, dest, destPos, src.length);
    }
}
