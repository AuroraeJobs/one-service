package com.one.common.excel;

import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.one.common.util.FileUtil;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;
import java.util.Map;

/**
 * @author aurorae
 */
public class ExcelWorkBook {

    private final XSSFWorkbook workbook;

    public ExcelWorkBook() {
        workbook = new XSSFWorkbook();
    }

    public ExcelSheet createSheet() {
        return new ExcelSheet(workbook.createSheet("Sheet1"));
    }

    public ExcelSheet createSheet(String sheetName) {
        return new ExcelSheet(workbook.createSheet(sheetName));
    }

    public ExcelSheet createSheet(String sheetName, List<Map<String, Object>> data) {
        return new ExcelSheet(workbook.createSheet(sheetName), data);
    }

    public ExcelSheet createSheet(String sheetName, List<String> titles, List<Map<String, Object>> data, int defaultColumnWidth, float defaultRowHeightInPoints) {
        return new ExcelSheet(workbook.createSheet(sheetName), titles, data, defaultColumnWidth, defaultRowHeightInPoints);
    }

    public ExcelSheet createSheet(String sheetName, List<String> titles, List<Map<String, Object>> data, int pageSize, int defaultColumnWidth, float defaultRowHeightInPoints) {
        return new ExcelSheet(workbook.createSheet(sheetName), titles, data, pageSize, defaultColumnWidth, defaultRowHeightInPoints);
    }

    public CellStyle fillCellColor(short bg) {
        CellStyle cellStyle = workbook.createCellStyle();
        cellStyle.setFillPattern(CellStyle.SOLID_FOREGROUND);
        // IndexedColors
        cellStyle.setFillForegroundColor(bg);
        return cellStyle;
    }

    public CellStyle createCellStyle(ExcelCellStyle excelCellStyle) {
        CellStyle cellStyle = workbook.createCellStyle();
        // 使换行等特殊格式化字符是否有效
        cellStyle.setWrapText(excelCellStyle.isWrapText());
        // 垂直效果
        cellStyle.setVerticalAlignment(excelCellStyle.getVerticalAlignment());
        // 水平效果
        cellStyle.setAlignment(excelCellStyle.getAlignment());
        cellStyle.setFont(createFont(excelCellStyle.getFont()));
        // 边框效果
        cellStyle.setBorderTop(excelCellStyle.getBorderTop());
        cellStyle.setBorderBottom(excelCellStyle.getBorderBottom());
        cellStyle.setBorderLeft(excelCellStyle.getBorderLeft());
        cellStyle.setBorderRight(excelCellStyle.getBorderRight());
        return cellStyle;
    }

    public Font createFont(ExcelFont excelFont) {
        Font font = workbook.createFont();
        font.setFontName(excelFont.getName());
        font.setFontHeightInPoints(excelFont.getHeightInPoints());
        font.setUnderline(excelFont.getUnderline());
        return font;
    }

    public Font createFont(short color) {
        Font font = workbook.createFont();
        font.setColor(color);
        return font;
    }

    public static ExcelSheet writeSheet(List<Map<Integer, Integer>> data, String filePath) throws IOException {
        return new ExcelWorkBook().writeSheet(data, "Sheet1", filePath);
    }

    public ExcelSheet writeSheet(List<Map<Integer, Integer>> data, String sheetName, String filePath) throws IOException {
        ExcelSheet sheet = createSheet(sheetName).initData(data);
        write(filePath);
        return sheet;
    }

    public ExcelWorkBook write(String filePath) throws IOException {
        return write(FileUtil.newFile(filePath));
    }

    public ExcelWorkBook write(File file) throws IOException {
        workbook.write(Files.newOutputStream(file.toPath()));
        return this;
    }
}
