package org.aurorae.cwl.excel;

import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.aurorae.common.excel.ExcelWorkBook;

import java.util.HashMap;
import java.util.Map;

public class CwlExcelWorkBook extends ExcelWorkBook {

    private final short[] color = new short[]{11, 13, 14, 15, 17, 19, 21, 22, 23, 24, 26, 27, 29, 31, 34, 35, 40, 41, 42, 43, 44, 45, 46, 47, 49, 50, 51, 52, 53, 54, 55, 57, 70};

    public Map<Integer, CellStyle> getFillCellColorMap() {
        Map<Integer, CellStyle> cellStyle = new HashMap<>();
        for (int i = 0; i < color.length; i++) {
            cellStyle.put(i + 1, fillCellColor(color[i]));
        }
        return cellStyle;
    }

    public CellStyle getLuckyCellStyle() {
        CellStyle luckyStyle = this.fillCellColor((short) 9);
        luckyStyle.setFont(this.createFont(Font.COLOR_RED));
        return luckyStyle;
    }
}
