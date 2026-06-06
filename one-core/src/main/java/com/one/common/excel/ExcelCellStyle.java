package com.one.common.excel;

import lombok.Data;
import org.apache.poi.ss.usermodel.CellStyle;

/**
 * @author aurorae
 */
@Data
public class ExcelCellStyle {

    /**
     * 使换行等特殊格式化字符是否有效
     */
    private boolean wrapText;

    /**
     * 垂直效果
     */
    private short verticalAlignment;

    /**
     * 水平效果
     */
    private short alignment;

    /**
     * 边框效果
     */
    private short border;
    private short borderTop;
    private short borderBottom;
    private short borderLeft;
    private short borderRight;

    /**
     * 字体
     */
    private ExcelFont font;

    private ExcelColor color;

    public ExcelCellStyle() {
    }

    public ExcelCellStyle(boolean wrapText, short verticalAlignment, short alignment, short border, ExcelFont font) {
        this.wrapText = wrapText;
        this.verticalAlignment = verticalAlignment;
        this.alignment = alignment;
        this.border = border;
        this.font = font;
    }

    /**
     * 默认样式：垂直居中
     *
     * @param alignment 自定义水平样式
     * @param border    自定义边框
     * @param font      自定义字体
     */
    public ExcelCellStyle(short alignment, short border, ExcelFont font) {
        this.wrapText = true;
        this.verticalAlignment = CellStyle.VERTICAL_CENTER;
        this.alignment = alignment;
        this.border = border;
        this.font = font;
        setExcelBorder(border);
    }

    /**
     * 默认样式：垂直居中 + 水平居中
     *
     * @param borderTop,borderBottom,borderLeft,borderRight 自定义四边框
     * @param font                                          自定义字体
     */
    public ExcelCellStyle(short borderTop, short borderBottom, short borderLeft, short borderRight, ExcelFont font) {
        this.wrapText = true;
        this.verticalAlignment = CellStyle.VERTICAL_CENTER;
        this.alignment = CellStyle.ALIGN_CENTER;
        this.font = font;
        setExcelBorder(borderTop, borderBottom, borderLeft, borderRight);
    }

    /**
     * 默认样式：垂直居中 + 水平居中
     *
     * @param border 自定义边框
     * @param font   自定义字体
     */
    public ExcelCellStyle(short border, ExcelFont font) {
        this.wrapText = true;
        this.verticalAlignment = CellStyle.VERTICAL_CENTER;
        this.alignment = CellStyle.ALIGN_CENTER;
        this.border = border;
        this.font = font;
        setExcelBorder(border);
    }

    /**
     * 默认样式：垂直居中 + 水平居中 + 无边框
     *
     * @param font 自定义字体
     */
    public ExcelCellStyle(ExcelFont font) {
        this.wrapText = true;
        this.verticalAlignment = CellStyle.VERTICAL_CENTER;
        this.alignment = CellStyle.ALIGN_CENTER;
        this.border = CellStyle.BORDER_NONE;
        this.font = font;
    }

    public void setExcelBorder(short border) {
        this.borderTop = border;
        this.borderBottom = border;
        this.borderLeft = border;
        this.borderRight = border;
    }

    public void setExcelBorder(short borderTop, short borderBottom, short borderLeft, short borderRight) {
        this.borderTop = borderTop;
        this.borderBottom = borderBottom;
        this.borderLeft = borderLeft;
        this.borderRight = borderRight;
    }
}
