package org.aurorae.cwl.excel;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.excel.ExcelWorkBook;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
public class CwlExcelWriter {

    public static final String FILE_PATH = "/Users/aurorae/Protect/体彩/%s.xlsx";

    public static String getFilePath() {
        return String.format(FILE_PATH, System.currentTimeMillis());
    }

    public static void write(ExcelWorkBook workBook) {
        try {
            workBook.write(getFilePath());
        } catch (IOException e) {
            log.error(e.getMessage(), e);
        }
    }

    public static void write(List<Map<Integer, Integer>> data) {
        try {
            ExcelWorkBook.writeSheet(data, getFilePath());
        } catch (IOException e) {
            log.error(e.getMessage(), e);
        }
    }
}
