package org.aurorae.record.ball;

import lombok.Getter;
import lombok.Setter;
import org.aurorae.common.excel.ExcelRow;
import org.aurorae.common.excel.ExcelSheet;
import org.aurorae.record.excel.IColumn;
import org.aurorae.record.excel.RecordExcel;
import org.aurorae.record.excel.RecordWorkBook;

import java.util.Collection;

@Getter
@Setter
public class BoxBook {

    private final RecordWorkBook workBook;

    private final ExcelSheet countSheet;

    private final ExcelSheet rateSheet;

    public BoxBook() {
        this.workBook = new RecordWorkBook();
        this.countSheet = workBook.createSheet("count");
        this.rateSheet = workBook.createSheet("rate");
    }

    public static <T extends IColumn> BoxBook one(Collection<T> columns) {
        BoxBook book = new BoxBook();
        init(columns, book.countSheet);
        init(columns, book.rateSheet);
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

    public ExcelRow createRow(int rowNum, ExcelSheet sheet) {
        ExcelRow row = sheet.createRow(rowNum);
        row.createCell(0, rowNum);
        return row;
    }

    public void countRow(int issue, Collection<Ball> balls) {
        ExcelRow row = createRow(issue, this.countSheet);
        balls.forEach(ball -> row.createCell(ball.getColumn(), ball.getCount()));
    }

    public void rateRow(int issue, Collection<Ball> balls) {
        ExcelRow row = createRow(issue, this.rateSheet);
        balls.forEach(ball -> row.createCell(ball.getColumn(), ball.getRate()));
    }
}
