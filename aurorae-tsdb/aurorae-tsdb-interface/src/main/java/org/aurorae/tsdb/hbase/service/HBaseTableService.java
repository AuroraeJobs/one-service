package org.aurorae.tsdb.hbase.service;

import org.aurorae.tsdb.api.IMetricPut;
import org.aurorae.tsdb.hbase.dao.HBaseEventManager;
import org.aurorae.tsdb.hbase.dao.HBaseTableDelete;
import org.aurorae.tsdb.hbase.dao.HBaseTablePut;
import org.aurorae.tsdb.hbase.dao.HBaseTableQuery;
import org.aurorae.tsdb.hbase.table.HBaseTable;
import org.aurorae.tsdb.hbase.util.HBaseClient;
import org.aurorae.tsdb.opentsdb.MetricDPs;
import org.aurorae.tsdb.opentsdb.MetricQueries;
import lombok.extern.slf4j.Slf4j;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
public class HBaseTableService {

    private final HBaseTable table;

    private final HBaseEventManager queue;

    public HBaseTableService(HBaseTable table) {
        log.debug("> HBaseTable [{}] init start...", table.getTableName());
        this.table = table;
        this.queue = new HBaseEventManager(table.getTableName());
        try {
            HBaseClient.createTable(table.getTableName(), Collections.singletonList(HBaseTable.COLUMN_DATA));
            HBaseClient.createTable(table.getUidTableName(), Arrays.asList(HBaseTable.COLUMN_ID, HBaseTable.COLUMN_NAME));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }
    }

    public void put(IMetricPut request) {
        queue.doEvent(HBaseTablePut.exe(table, request));
    }

    public List<MetricDPs> query(MetricQueries request) {
        return HBaseTableQuery.exe(table, request);
    }

    public List<MetricDPs> query(long start, long end, Map<String, Object> tags) {
        return HBaseTableQuery.exe(table, start, end, tags);
    }

    public void delete(MetricQueries request) {
        HBaseTableDelete.exe(table, request);
    }

    public void delete(long start, long end, Map<String, Object> tags) {
        HBaseTableDelete.exe(table, start, end, tags);
    }

    public void clearCache() {
        table.clearTagUid();
    }
}
