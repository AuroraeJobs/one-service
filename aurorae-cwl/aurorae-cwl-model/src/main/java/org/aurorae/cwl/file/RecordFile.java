package org.aurorae.cwl.file;

import cn.hutool.core.io.FileUtil;
import lombok.SneakyThrows;
import org.aurorae.common.util.StreamUtil;
import org.aurorae.cwl.response.Record;

import java.io.BufferedReader;
import java.io.FileReader;
import java.util.List;

public class RecordFile {

    public static final String FILE_PATH = "/Users/aurorae/Project/Space/aurorae-service/aurorae-cwl/aurorae-cwl-service/src/main/resources/";
    public static final String RECORD = "record.txt";
    public static final String RECORDS = "records.txt";
    public static final String BALL_RED = "ball_red.txt";
    public static final String BALL_BLUE = "ball_blue.txt";

    public static final int LENGTH = 2;

    public static String[] substring(String record, int hits) {
        String[] records = new String[hits];
        int beginIndex;
        for (int i = 0; i < hits; i++) {
            beginIndex = i * LENGTH;
            records[i] = record.substring(beginIndex, beginIndex + LENGTH);
        }
        return records;
    }

    public static String readAll() {
        return read(RECORD);
    }

    @SneakyThrows
    public static BufferedReader reader() {
        return new BufferedReader(new FileReader(FILE_PATH + RECORDS));
    }

    public static void write(List<Record> cwlList) {
        append(StreamUtil.toList(cwlList, Record::record), RECORD);
        appendLines(StreamUtil.toList(cwlList, Record::record), RECORDS);
        appendLines(StreamUtil.toList(cwlList, Record::getRed), BALL_RED);
        appendLines(StreamUtil.toList(cwlList, Record::getBlue), BALL_BLUE);
    }

    public static String read(String fileName) {
        return FileUtil.readUtf8String(FILE_PATH + fileName);
    }

    public static void append(List<String> strings, String fileName) {
        strings.forEach(s -> FileUtil.appendUtf8String(s, FILE_PATH + fileName));
    }

    public static void appendLines(List<String> strings, String fileName) {
        FileUtil.appendUtf8Lines(strings, FILE_PATH + fileName);
    }
}
