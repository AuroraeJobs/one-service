package org.aurorae.cwl.file;

import java.io.BufferedReader;
import java.io.FileReader;
import java.util.List;

import org.aurorae.common.util.StreamUtil;
import org.aurorae.cwl.response.CwlResult;

import cn.hutool.core.io.FileUtil;
import lombok.SneakyThrows;

public class CwlFile {

    public static final String FILE_PATH   = "/Users/aurorae/Project/Space/aurorae-service/aurorae-cwl/aurorae-cwl-service/src/main/resources/";
    public static final String RECORD_ALL  = "all.txt";
    public static final String RECORD_FILE = "records.txt";

    public static final int    LENGTH      = 2;

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
        return read(RECORD_ALL);
    }

    @SneakyThrows
    public static BufferedReader reader() {
        return new BufferedReader(new FileReader(FILE_PATH + RECORD_FILE));
    }

    public static void write(List<CwlResult> cwlList) {
        write(cwlList, RECORD_ALL);
        appendLines(StreamUtil.toList(cwlList, CwlResult::getAll), RECORD_FILE);
    }

    public static void write(List<CwlResult> cwlList, String fileName) {
        append(StreamUtil.toList(cwlList, CwlResult::getAll), fileName);
    }

    public static void append(List<String> strings, String fileName) {
        strings.forEach(s -> FileUtil.appendUtf8String(s, FILE_PATH + fileName));
    }

    public static String read(String fileName) {
        return FileUtil.readUtf8String(FILE_PATH + fileName);
    }

    public static void appendLines(List<String> strings, String fileName) {
        FileUtil.appendUtf8Lines(strings, FILE_PATH + fileName);
    }
}
