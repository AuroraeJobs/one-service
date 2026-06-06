package com.one.common.excel;

import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;

import java.util.Map;

/**
 * @author aurorae
 */
public class ExcelRow {

    private Row row;

    public ExcelRow(Row row) {
        this.row = row;
    }

    public Row getRow() {
        return row;
    }

    public void setRow(Row row) {
        this.row = row;
    }

    public ExcelRow setHeightInPoints(float heightInPoints) {
        row.setHeightInPoints(heightInPoints);
        return this;
    }

    public ExcelCell createCell(int column, double cellValue) {
        return new ExcelCell(row.createCell(column), cellValue);
    }

    public ExcelCell createCell(int column, String cellValue) {
        return new ExcelCell(row.createCell(column), cellValue);
    }

    public ExcelRow createCell(int column, String cellValue, CellStyle cellStyle) {
        new ExcelCell(row.createCell(column), cellValue, cellStyle);
        return this;
    }

    public void initData(Map<Integer, Integer> data) {
        data.forEach((column, value) -> row.createCell(column).setCellValue(value));
    }
}
