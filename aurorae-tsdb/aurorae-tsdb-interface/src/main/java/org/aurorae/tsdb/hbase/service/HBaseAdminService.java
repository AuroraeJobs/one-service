package org.aurorae.tsdb.hbase.service;

import com.alibaba.fastjson.JSON;
import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.hbase.Cell;
import org.aurorae.tsdb.hbase.table.HBaseTable;
import org.aurorae.tsdb.hbase.util.HBaseCell;
import org.aurorae.tsdb.hbase.util.HBaseClient;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
public class HBaseAdminService {

    public HBaseAdminService() {
        try {
            HBaseClient.createTable(HBaseTable.TABLE_ADMIN, Collections.singletonList(HBaseTable.COLUMN_DATA));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }
    }

    public void putTable(HBaseTable table) {
        try {
            String json = JSON.toJSONString(table);
            HBaseClient.put(HBaseTable.TABLE_ADMIN, table.getTableName(), HBaseTable.COLUMN_DATA, HBaseTable.COLUMN_DATA, json);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }
    }

    public List<HBaseTable> getTables() {
        final List<HBaseTable> tables = new ArrayList<>();
        try {
            HBaseClient.scanAll(HBaseTable.TABLE_ADMIN, result -> {
                List<Cell> cells = result.listCells();
                for (Cell cell : cells) {
                    String qualifier = HBaseCell.getQualifier(cell);
                    String tags = HBaseCell.getTags(cell);
                    String family = HBaseCell.getFamily(cell);
                    String row = HBaseCell.getRow(cell);
                    String value = HBaseCell.getValue(cell);
                    log.info("\n> qualifier: {}, tags: {}, family: {}, row: {}\n> value: {}", qualifier, tags, family, row, value);
                    HBaseTable table = JSON.parseObject(value, HBaseTable.class);
                    tables.add(table);
                }
            });
        } catch (IOException e) {
            log.error(e.getMessage(), e);
        }
        return tables;
    }
}
