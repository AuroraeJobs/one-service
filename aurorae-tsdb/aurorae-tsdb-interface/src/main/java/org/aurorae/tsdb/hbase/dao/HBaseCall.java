package org.aurorae.tsdb.hbase.dao;

import org.aurorae.tsdb.api.IMetricPut;
import org.aurorae.tsdb.hbase.service.HBaseTableService;
import org.aurorae.tsdb.hbase.table.HBaseTable;
import org.aurorae.tsdb.opentsdb.MetricDPs;

import java.util.List;
import java.util.Map;

public class HBaseCall {

    private final HBaseTableService service;

    public HBaseCall(HBaseTable table) {
        this.service = new HBaseTableService(table);
    }

    public void put(IMetricPut put) {
        service.put(put);
    }

    public List<MetricDPs> query(long start, long end, Map<String, Object> tags) {
        return service.query(start, end, tags);
    }

    public void delete(long start, long end, Map<String, Object> tags) {
        service.delete(start, end, tags);
    }

    public void clearCache() {
        service.clearCache();
    }
}
