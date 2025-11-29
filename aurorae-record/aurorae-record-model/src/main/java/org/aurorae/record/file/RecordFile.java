package org.aurorae.record.file;

import cn.hutool.core.io.FileUtil;
import lombok.SneakyThrows;
import org.aurorae.common.util.StreamUtil;
import org.aurorae.record.response.Record;

import java.io.BufferedReader;
import java.io.FileReader;
import java.util.List;

public class RecordFile {

    public static final String FILE_PATH = "/Users/aurorae/Program/Hello/aurorae-service/aurorae-record/aurorae-record-service/src/main/resources/";
    public static final String RECORD = "record.txt";
    public static final String RECORDS = "records.txt";
    public static final String BALL_RED = "ball_red.txt";
    public static final String BALL_BLUE = "ball_blue.txt";

    public static String[] split(String record) {
        // 把字符串按每两位进行分割
        int bit = 2;
        // 分割之后的数组长度
        int lit = record.length() / bit;
        String[] records = new String[lit];
        int idx;
        for (int i = 0; i < lit; i++) {
            idx = i * bit;
            records[i] = record.substring(idx, idx + bit);
        }
        return records;
    }

    public static String read(String fileName) {
        return FileUtil.readUtf8String(FILE_PATH + fileName);
    }

    @SneakyThrows
    public static BufferedReader reader(String fileName) {
        return new BufferedReader(new FileReader(FILE_PATH + fileName));
    }

    public static void write(List<Record> records) {
        append(StreamUtil.joining(records, Record::record), RECORD);
        append(StreamUtil.toList(records, Record::record), RECORDS);
        append(StreamUtil.toList(records, Record::getRed), BALL_RED);
        append(StreamUtil.toList(records, Record::getBlue), BALL_BLUE);
    }

    public static void append(String string, String fileName) {
        FileUtil.appendUtf8String(string, FILE_PATH + fileName);
    }

    public static void append(List<String> strings, String fileName) {
        FileUtil.appendUtf8Lines(strings, FILE_PATH + fileName);
    }
}
