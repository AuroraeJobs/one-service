package com.one.common.excel;

import lombok.Getter;
import lombok.Setter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.util.CellRangeAddress;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * @author aurorae
 */
@Getter
@Setter
public class ExcelSheet {

    private Sheet sheet;

    private List<String> titles;

    private int titleSize;

    private List<Map<String, Object>> data;

    private int dataSize;

    private int pageSize;

    private int pageTotal;

    private int defaultColumnWidth;

    private float defaultRowHeightInPoints;

    public ExcelSheet() {
    }

    public ExcelSheet(Sheet sheet) {
        this.sheet = sheet;
    }

    public ExcelSheet(Sheet sheet, List<Map<String, Object>> data) {
        this.sheet = sheet;
        this.data = data;
        this.dataSize = data.size();
    }

    public ExcelSheet(Sheet sheet, List<String> titles, List<Map<String, Object>> data, int defaultColumnWidth, float defaultRowHeightInPoints) {
        this.sheet = sheet;
        this.titles = titles;
        this.titleSize = titles.size();
        this.data = data;
        this.dataSize = data.size();
        sheet.setDefaultColumnWidth(defaultColumnWidth);
        sheet.setDefaultRowHeightInPoints(defaultRowHeightInPoints);
    }

    public ExcelSheet(Sheet sheet, List<String> titles, List<Map<String, Object>> data, int pageSize, int defaultColumnWidth, float defaultRowHeightInPoints) {
        this.sheet = sheet;
        this.titles = titles;
        this.titleSize = titles.size();
        this.data = data;
        this.pageSize = pageSize;
        this.pageTotal = (data.size() % pageSize == 0) ? (data.size() / pageSize) : (data.size() / pageSize + 1);
        sheet.setDefaultColumnWidth(defaultColumnWidth);
        sheet.setDefaultRowHeightInPoints(defaultRowHeightInPoints);
    }

    public String getTitle(int i) {
        return titles.get(i);
    }

    /**
     * 获取分页数据
     *
     * @param page 页数
     * @return data
     */
    public List<Map<String, Object>> getDataByPage(int page) {
        return data.stream().skip((long) page * pageSize).limit(pageSize).collect(Collectors.toList());
    }

    public Map<String, Object> getDataByRow(int i) {
        return data.get(i);
    }

    public ExcelSheet initRow(int start) {
        for (int i = 0; i < getDataSize(); i++) {
            createRow(i + start);
        }
        return this;
    }

    public ExcelRow getRow(int i) {
        return new ExcelRow(sheet.getRow(i));
    }

    public Row row(int i) {
        return Optional.ofNullable(this.sheet.getRow(i)).orElseGet(() -> this.sheet.createRow(i));
    }

    public ExcelSheet initData(List<Map<Integer, Integer>> data) {
        for (int i = 0; i < data.size(); i++) {
            createRow(i).initData(data.get(i));
        }
        return this;
    }

    /**
     * 合并单元格
     *
     * @param firstRow 起始行
     * @param lastRow  起始行
     * @param firstCol 起始列
     * @param lastCol  起始列
     * @return this
     */
    public ExcelSheet addMergedRegion(int firstRow, int lastRow, int firstCol, int lastCol) {
        sheet.addMergedRegion(new CellRangeAddress(firstRow, lastRow, firstCol, lastCol));
        return this;
    }

    /**
     * 创建行
     *
     * @param i 行号
     * @return row
     */
    public ExcelRow createRow(int i) {
        return new ExcelRow(sheet.createRow(i));
    }

    public void setDefaultRowHeightInPoints(float defaultRowHeightInPoints) {
        this.defaultRowHeightInPoints = defaultRowHeightInPoints;
    }
}
