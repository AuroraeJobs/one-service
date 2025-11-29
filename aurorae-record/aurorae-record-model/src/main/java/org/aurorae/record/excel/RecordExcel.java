package org.aurorae.record.excel;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.common.excel.ExcelWorkBook;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
public class RecordExcel {

    public static final String FILE_PATH = "/Users/aurorae/Documents/中奖啦/%s.xlsx";

    public static String getFilePath(String filename) {
        return String.format(FILE_PATH, filename);
    }

    public static void write(ExcelWorkBook workBook, String filename) {
        try {
            workBook.write(getFilePath(filename));
        } catch (IOException e) {
            log.error(e.getMessage(), e);
        }
    }

    public static void write(List<Map<Integer, Integer>> data, String filename) {
        try {
            ExcelWorkBook.writeSheet(data, getFilePath(filename));
        } catch (IOException e) {
            log.error(e.getMessage(), e);
        }
    }
}
