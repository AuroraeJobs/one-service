package org.aurorae.record.model;

import java.util.Collection;

import org.aurorae.common.excel.ExcelRow;
import org.aurorae.common.excel.ExcelSheet;
import org.aurorae.record.excel.RecordWorkBook;
import org.aurorae.record.excel.RecordExcel;
import org.aurorae.record.excel.IColumn;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BoxBook {

    private final RecordWorkBook workBook;

    private final ExcelSheet       sheet;

    public BoxBook(){
        this.workBook = new RecordWorkBook();
        this.sheet = workBook.createSheet();
    }

    public static <T extends IColumn> BoxBook one(Collection<T> columns) {
        BoxBook book = new BoxBook();
        init(columns, book.sheet);
        return book;
    }

    public static <T extends IColumn> void init(Collection<T> columns, ExcelSheet sheet) {
        ExcelRow row = sheet.createRow(0);
        for (IColumn column : columns) {
            row.createCell(column.getColumn(), column.getTitle());
        }
    }

    public void write(String filename) {
        RecordExcel.write(this.workBook, filename);
    }
}
