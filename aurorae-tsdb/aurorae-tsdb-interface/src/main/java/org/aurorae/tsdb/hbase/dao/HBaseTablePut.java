package org.aurorae.tsdb.hbase.dao;

import org.aurorae.tsdb.api.IMetricPut;
import org.aurorae.tsdb.hbase.table.HBaseTable;
import org.aurorae.tsdb.hbase.table.HBaseValue;
import org.apache.hadoop.hbase.client.Put;
import org.apache.hadoop.hbase.util.Bytes;

import java.util.Map;

public class HBaseTablePut {

    public static Put exe(HBaseTable table, IMetricPut put) {
        return exe(table, put.getTimestamp(), put.getValue(), put.getTags());
    }

    public static Put exe(HBaseTable table, long timestamp, Object value, Map<String, Object> useTags) {
        byte[] row = table.newRow(timestamp, useTags, false);
        HBaseValue hValue = new HBaseValue(value, table.isCompressed());
        long qualifier = HBaseRowHelper.getCol(timestamp, table.getPeriod());
        qualifier = (qualifier << HBaseTable.TIME_BIT) | hValue.dataType;
        return new Put(row).addColumn(HBaseTable.COLUMN_DATA_BYTE, Bytes.toBytes(qualifier), hValue.data);
    }
}
