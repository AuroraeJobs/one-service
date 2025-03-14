package org.aurorae.tsdb.hbase.dao;

import org.aurorae.tsdb.hbase.table.HBaseTable;
import org.aurorae.tsdb.hbase.table.HBaseTagKey;
import org.aurorae.tsdb.hbase.table.HBaseValue;
import org.aurorae.tsdb.hbase.util.HBaseCell;
import org.aurorae.tsdb.hbase.util.HBaseClient;
import org.aurorae.tsdb.opentsdb.MetricDPs;
import org.aurorae.tsdb.opentsdb.MetricQueries;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.hbase.Cell;
import org.apache.hadoop.hbase.client.Result;
import org.apache.hadoop.hbase.client.Scan;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Getter
public class HBaseTableQuery {

    public static List<MetricDPs> exe(HBaseTable table, MetricQueries request) {
        return request.getQueries()
                .stream()
                .map(query -> exe(table, request.getStartTime(), request.getEndTime(), query.getTags()))
                .filter(items -> !items.isEmpty())
                .flatMap(Collection::stream)
                .collect(Collectors.toList());
    }

    public static List<MetricDPs> exe(HBaseTable table, long start, long end, Map<String, Object> useTags) {
        List<MetricDPs> items = new ArrayList<>();
        Scan scan = new Scan();
        scan.setStartRow(table.newRow(start, useTags, false));
        scan.setStopRow(table.newRow(end, useTags, true));
        HBaseClient.scan(table.getTableName(), scan, result -> {
            Map<String, Object> tags = new LinkedHashMap<>();
            byte[] row = result.getRow();
            int pos = 0;
            for (HBaseTagKey tagKey : table.getTags()) {
                String key = tagKey.getName();
                int width = tagKey.getWidth();
                byte[] bytes = HBaseCell.toBytes(row, pos, width, width);
                Object tagValue = table.getTagValueId(key).getValue(table.getUidTableName(), bytes);
                Object value = HBaseTable.getTagValue(key, useTags);
                if (value != null && tagValue != null && !value.equals(tagValue) && !value.toString().equals(tagValue.toString())) {
                    return;
                }
                tags.put(key, tagValue);
                pos += width;
            }
            Map<Long, Object> dps = getDps(table, result, start, end);
            MetricDPs item = MetricDPs.builder().metric(table.getTableName()).tags(tags).dps(dps).build();
            items.add(item);
        });
        return items;
    }

    private static Map<Long, Object> getDps(HBaseTable table, Result result, long start, long end) {
        long rowTime = table.getRowTime(result.getRow());
        if (rowTime >= end) {
            return null;
        }
        Map<Long, Object> dps = new LinkedHashMap<>();
        for (Cell cell : result.listCells()) {
            long qualifier = HBaseCell.getQualifierLong(cell);
            short dataType = (short) (qualifier & 0xFF);
            long offset = qualifier >> HBaseTable.TIME_BIT;
            long timestamp = HBaseRowHelper.offsetPeriodToMS(table.getPeriod(), rowTime, offset);
            if (timestamp < start || timestamp > end) {
                continue;
            }
            byte[] valueArray = HBaseCell.getValueByte(cell);
            if (valueArray.length != 0) {
                Object value = HBaseValue.getValueByType(valueArray, dataType);
                dps.put(timestamp, value);
            }
        }
        return dps;
    }
}