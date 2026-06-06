package com.one.common.excel;

import org.apache.poi.ss.usermodel.Font;

/**
 * @author aurorae
 */
public class ExcelFont {

    private String name;

    private short heightInPoints;

    private byte underline;

    public ExcelFont(String name, short heightInPoints, byte underline) {
        this.name = name;
        this.heightInPoints = heightInPoints;
        this.underline = underline;
    }

    public ExcelFont(String name, short heightInPoints) {
        this.name = name;
        this.heightInPoints = heightInPoints;
        this.underline = Font.U_NONE;
    }

    public ExcelFont(short heightInPoints, byte underline) {
        this.name = "等线";
        this.heightInPoints = heightInPoints;
        this.underline = underline;
    }

    public ExcelFont(short heightInPoints) {
        this.name = "等线";
        this.heightInPoints = heightInPoints;
        this.underline = Font.U_NONE;
    }

    public void setFont(String fontName, short fontHeightInPoints, byte fontUnderline) {
        this.name = fontName;
        this.heightInPoints = fontHeightInPoints;
        this.underline = fontUnderline;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public short getHeightInPoints() {
        return heightInPoints;
    }

    public void setHeightInPoints(short heightInPoints) {
        this.heightInPoints = heightInPoints;
    }

    public byte getUnderline() {
        return underline;
    }

    public void setUnderline(byte underline) {
        this.underline = underline;
    }
}
