package org.aurorae.tsdb.hbase.cell;

import org.aurorae.tsdb.hbase.table.HBaseTable;
import org.aurorae.tsdb.hbase.util.HBaseCell;
import org.apache.hadoop.hbase.Cell;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class HBaseCellFinder {

    long start;

    public HBaseCellFinder(long start) {
        this.start = start;
    }

    private int compare(Cell cell) {
        long qualifier = HBaseCell.getQualifierLong(cell);
        long cellTime = qualifier >> HBaseTable.TIME_BIT;
        return Long.compare(cellTime, start);
    }

    /**
     * 获取 开始扫描的索引序号
     *
     * @param listCells
     * @param start
     * @return 如果找到，返回的是 start 对应数据的索引,
     * 如果start比第一个小，返回的是-1，
     * 如果start比最后一个大，返回list的size，
     * 如果start处于列表内部的某个位置，比当前start小的最后一个值对应的位置，即是 (-(insertion point) - 1).
     */
    private static int getSearchIndex(List<Cell> listCells, long start) {
        HBaseCellFinder cf = new HBaseCellFinder(start);
        CellComparator cc = new CellComparator();
        return Collections.binarySearch(listCells, cf, cc);
    }

    static class CellComparator implements Comparator<Object> {
        @Override
        public int compare(Object o1, Object o2) {
            if (o1 instanceof Cell && o2 instanceof HBaseCellFinder) {
                Cell cell = (Cell) o1;
                return ((HBaseCellFinder) o2).compare(cell);
            }
            return 0;
        }
    }
}
