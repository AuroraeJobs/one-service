package org.aurorae.cwl.excel;

import org.aurorae.common.excel.ExcelSheet;
import org.aurorae.common.excel.ExcelWorkBook;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public class CwlExcelWriter {

    public static final String FILE_PATH = "/Users/aurorae/Downloads/体彩/%s.xlsx";

    public static String getFilePath() {
        return String.format(FILE_PATH, System.currentTimeMillis());
    }

    public static void write(ExcelWorkBook workBook) {
        try {
            workBook.write(getFilePath());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static ExcelSheet write(List<Map<Integer, Integer>> data) {
        try {
            return ExcelWorkBook.writeSheet(data, getFilePath());
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }
}
