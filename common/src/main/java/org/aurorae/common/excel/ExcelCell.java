package org.aurorae.common.excel;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;

/**
 * @author aurorae
 */
public class ExcelCell {

    private Cell cell;

    public ExcelCell(Cell cell, int cellValue) {
        this.cell = cell;
        cell.setCellValue(cellValue);
    }

    public ExcelCell(Cell cell, long cellValue) {
        this.cell = cell;
        cell.setCellValue(cellValue);
    }

    public ExcelCell(Cell cell, String cellValue) {
        this.cell = cell;
        cell.setCellValue(cellValue);
    }

    public ExcelCell(Cell cell, String cellValue, CellStyle cellStyle) {
        this.cell = cell;
        cell.setCellValue(cellValue);
        cell.setCellStyle(cellStyle);
    }

    public ExcelCell setCellStyle(CellStyle cellStyle) {
        cell.setCellStyle(cellStyle);
        return this;
    }

    public Cell getCell() {
        return cell;
    }

    public void setCell(Cell cell) {
        this.cell = cell;
    }
}
