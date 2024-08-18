package org.aurorae.cwl.client;

import cn.hutool.core.io.FileUtil;
import org.aurorae.common.util.StreamUtil;
import org.aurorae.cwl.response.CwlResult;

import java.util.List;

public class CwlFile {

    public static final String FILE_PATH = "/Users/aurorae/Project/Snoopy/aurorae-service/aurorae-cwl/aurorae-cwl-service/src/main/resources/all.txt";

    public static void write(List<CwlResult> cwlList) {
        append(StreamUtil.toList(cwlList, CwlResult::getAll));
    }

    public static void append(List<String> strings) {
        strings.forEach(s -> FileUtil.appendUtf8String(s, FILE_PATH));
    }

    public static String read() {
        return FileUtil.readUtf8String(FILE_PATH);
    }
}
