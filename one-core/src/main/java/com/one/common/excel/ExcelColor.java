package com.one.common.excel;

import lombok.Data;
import org.apache.poi.xssf.usermodel.XSSFColor;

import java.awt.*;

@Data
public class ExcelColor {

    private XSSFColor color;

    public ExcelColor(int r, int g, int b) {
        this.color = new XSSFColor(new Color(r, g, b));
    }
}
