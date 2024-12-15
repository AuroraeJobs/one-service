package org.aurorae.cwl.client;

import cn.hutool.core.io.FileUtil;
import org.aurorae.common.util.StreamUtil;
import org.aurorae.cwl.response.CwlResult;

import java.util.List;

public class CwlFile {

    public static final String FILE_PATH = "/Users/aurorae/Project/Space/aurorae-service/aurorae-cwl/aurorae-cwl-service/src/main/resources/";

    public static String read() {
        return read("all.txt");
    }

    public static void write(List<CwlResult> cwlList) {
        write(cwlList, "all.txt");
        appendLines(StreamUtil.toList(cwlList, CwlResult::getAll), "cwl.txt");
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

    public static void appendLines(List<String> sorted, String fileName) {
        FileUtil.appendUtf8Lines(sorted, FILE_PATH + fileName);
    }
}
