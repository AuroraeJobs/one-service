package org.aurorae.tsdb.hbase.dao;

import org.aurorae.tsdb.hbase.table.HBaseTable;
import org.aurorae.tsdb.hbase.table.HBaseTagKey;
import org.aurorae.tsdb.hbase.util.HBaseClient;
import org.aurorae.tsdb.opentsdb.MetricQueries;
import org.apache.hadoop.hbase.client.Scan;
import org.apache.hadoop.hbase.util.Bytes;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class HBaseTableDelete {

    public static void exe(HBaseTable table, MetricQueries request) {
        request.getQueries().forEach(query -> exe(table, request.getStartTime(), request.getEndTime(), query.getTags()));
    }

    public static void exe(HBaseTable table, long start, long end, Map<String, Object> useTags) {
        List<byte[]> rows = new ArrayList<>();
        Scan scan = new Scan();
        scan.setStartRow(table.newRow(start, useTags, false));
        scan.setStopRow(table.newRow(end, useTags, true));
        HBaseClient.scan(table.getTableName(), scan, result -> {
            byte[] row = result.getRow();
            int pos = 0;
            for (HBaseTagKey tagKey : table.getTags()) {
                String key = tagKey.getName();
                int width = tagKey.getWidth();
                Object value = HBaseTable.getTagValue(key, useTags);
                if (value != null) {
                    byte[] tagUid = table.getTagValueId(key).getId(table.getUidTableName(), value);
                    if (tagUid == null || Bytes.compareTo(row, pos, width, tagUid, 0, tagUid.length) != 0) {
                        return;
                    }
                }
                pos += width;
            }
            rows.add(row);
        });
        HBaseClient.deleteRows(table.getTableName(), rows);
    }
}
