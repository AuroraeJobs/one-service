package org.aurorae.tsdb.hbase.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.hbase.Cell;
import org.apache.hadoop.hbase.HColumnDescriptor;
import org.apache.hadoop.hbase.HTableDescriptor;
import org.apache.hadoop.hbase.TableName;
import org.apache.hadoop.hbase.client.*;
import org.apache.hadoop.hbase.filter.Filter;
import org.apache.hadoop.hbase.util.Bytes;
import org.springframework.beans.factory.annotation.Autowired;

import java.io.IOException;
import java.util.*;
import java.util.function.Consumer;
import java.util.stream.Collectors;

@Slf4j
public class HBaseClient {

    private static Admin admin;

    @Autowired
    public void setHbaseAdmin(Admin hbaseAdmin) {
        HBaseClient.admin = hbaseAdmin;
    }

    /**
     * 判断表是否存在
     *
     * @param tableName 表名
     * @return true/false
     */
    public static boolean isExists(String tableName) {
        boolean tableExists = false;
        try {
            TableName table = TableName.valueOf(tableName);
            tableExists = admin.tableExists(table);
        } catch (IOException e) {
            log.error(e.getMessage(), e);
        }
        return tableExists;
    }

    /**
     * 创建表
     *
     * @param tableName    表名
     * @param columnFamily 列族
     * @return true/false
     */
    public static boolean createTable(String tableName, List<String> columnFamily) {
        return createTable(tableName, columnFamily, null);
    }

    /**
     * 预分区创建表
     *
     * @param tableName    表名
     * @param columnFamily 列族
     * @param keys         分区集合
     * @return true/false
     */
    public static boolean createTable(String tableName, List<String> columnFamily, List<String> keys) {
        if (!isExists(tableName)) {
            try {
                TableName table = TableName.valueOf(tableName);
                HTableDescriptor desc = new HTableDescriptor(table);
                for (String cf : columnFamily) {
                    desc.addFamily(new HColumnDescriptor(cf));
                }
                if (keys == null) {
                    admin.createTable(desc);
                } else {
                    byte[][] splitKeys = getSplitKeys(keys);
                    admin.createTable(desc, splitKeys);
                }
                log.info("> HBaseTable [{}] create success!", tableName);
                return true;
            } catch (IOException e) {
                log.error(e.getMessage(), e);
            }
        } else {
            log.info("> HBaseTable [{}] is exists!", tableName);
            return false;
        }
        return false;
    }

    /**
     * 删除表
     *
     * @param tableName 表名
     */
    public static void dropTable(String tableName) throws IOException {
        if (isExists(tableName)) {
            TableName table = TableName.valueOf(tableName);
            admin.disableTable(table);
            admin.deleteTable(table);
        }
    }

    /**
     * 插入数据（单条）
     *
     * @param tableName    表名
     * @param row       row
     * @param columnFamily 列族
     * @param column       列
     * @param value        值
     * @return true/false
     */
    public static boolean put(String tableName, String row, String columnFamily, String column, String value) {
        return put(tableName, row, columnFamily, Collections.singletonList(column), Collections.singletonList(value));
    }

    /**
     * 插入数据（批量）
     *
     * @param tableName    表名
     * @param row       row
     * @param columnFamily 列族
     * @param columns      列
     * @param values       值
     * @return true/false
     */
    public static boolean put(String tableName, String row, String columnFamily, List<String> columns, List<String> values) {
        try {
            Table table = admin.getConnection().getTable(TableName.valueOf(tableName));
            Put put = new Put(Bytes.toBytes(row));
            for (int i = 0; i < columns.size(); i++) {
                put.addColumn(Bytes.toBytes(columnFamily), Bytes.toBytes(columns.get(i)), Bytes.toBytes(values.get(i)));
            }
            table.put(put);
            table.close();
            return true;
        } catch (IOException e) {
            log.error(e.getMessage(), e);
            return false;
        }
    }

    public static void put(String tableName, byte[] row, byte[] columnFamily, byte[] column, byte[] data) throws IOException {
        try (Table table = admin.getConnection().getTable(TableName.valueOf(tableName))) {
            Put put = new Put(row);
            put.addColumn(columnFamily, column, data);
            table.put(put);
        }
    }

    public static void put(String tableName, List<Put> list)  throws IOException{
        try (Table table = admin.getConnection().getTable(TableName.valueOf(tableName))) {
            table.put(list);
        }
    }

    public static long incrementValue(String tableName, byte[] row, byte[] columnFamily, byte[] column) throws IOException {
        Table table = admin.getConnection().getTable(TableName.valueOf(tableName));
        return table.incrementColumnValue(row, columnFamily, column, 1);
    }

    public static byte[] get(String tableName, byte[] row, byte[] columnFamily, byte[] column) throws IOException {
        try (Table table = admin.getConnection().getTable(TableName.valueOf(tableName))) {
            Get get = new Get(row);
            Result result = table.get(get);
            return result.getValue(columnFamily, column);
        }
    }

    public static void scanAll(String tableName, Consumer<Result> executor) throws IOException {
        scan(tableName, new Scan(), executor);
    }

    public static void scan(String tableName, Scan scan, Consumer<Result> executor) {
        try (Table table = admin.getConnection().getTable(TableName.valueOf(tableName))) {
            ResultScanner resultScanner = table.getScanner(scan);
            resultScanner.forEach(executor);
            resultScanner.close();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * 获取数据（全表数据）
     *
     * @param tableName 表名
     * @return map
     */
    public static List<Map<String, String>> scan(String tableName) {
        return scan(tableName, null);
    }

    /**
     * 获取数据（根据传入的filter）
     *
     * @param tableName 表名
     * @param filter    过滤器
     * @return map
     */
    public static List<Map<String, String>> scan(String tableName, Filter filter) {
        List<Map<String, String>> list = new ArrayList<>();
        try (Table table = admin.getConnection().getTable(TableName.valueOf(tableName))) {
            Scan scan = new Scan();
            // 添加过滤器
            scan.setFilter(filter);
            ResultScanner resultScanner = table.getScanner(scan);
            for (Result result : resultScanner) {
                HashMap<String, String> map = new HashMap<>();
                String row = Bytes.toString(result.getRow());
                map.put("row", row);
                convertMap(map, result);
                list.add(map);
            }
        } catch (IOException e) {
            log.error(e.getMessage(), e);
        }
        return list;
    }

    /**
     * 获取数据（根据row）
     *
     * @param tableName 表名
     * @param row    row
     * @return map
     */
    public static Map<String, String> get(String tableName, String row) {
        HashMap<String, String> map = new HashMap<>();
        try {
            Table table = admin.getConnection().getTable(TableName.valueOf(tableName));
            Get get = new Get(Bytes.toBytes(row));
            Result result = table.get(get);
            if (result != null && !result.isEmpty()) {
                convertMap(map, result);
            }
            table.close();
        } catch (IOException e) {
            log.error(e.getMessage(), e);
        }
        return map;
    }

    private static void convertMap(HashMap<String, String> map, Result result) {
        for (Cell cell : result.listCells()) {
            // 列族
            String family = HBaseCell.getFamilyCell(cell);
            // 列
            String qualifier = HBaseCell.getQualifier(cell);
            // 值
            String data = HBaseCell.getValueCell(cell);
            map.put(family + ":" + qualifier, data);
        }
    }


    /**
     * 获取数据（根据row，列族，列）
     *
     * @param tableName       表名
     * @param row          row
     * @param columnFamily    列族
     * @param columnQualifier 列
     * @return map
     */
    public static String get(String tableName, String row, String columnFamily, String columnQualifier) {
        String data = "";
        try {
            Table table = admin.getConnection().getTable(TableName.valueOf(tableName));
            Get get = new Get(Bytes.toBytes(row));
            get.addColumn(Bytes.toBytes(columnFamily), Bytes.toBytes(columnQualifier));
            Result result = table.get(get);
            if (result != null && !result.isEmpty()) {
                Cell cell = result.listCells().get(0);
                data = HBaseCell.getValue(cell);
            }
            table.close();
        } catch (IOException e) {
            log.error(e.getMessage(), e);
        }
        return data;
    }

    /**
     * 删除数据（根据row）
     *
     * @param tableName 表名
     * @param row    row
     */
    public static void delete(String tableName, String row) throws IOException {
        Table table = admin.getConnection().getTable(TableName.valueOf(tableName));
        Delete delete = new Delete(Bytes.toBytes(row));
        table.delete(delete);
        table.close();
    }

    /**
     * 删除数据（根据row，列族）
     *
     * @param tableName    表名
     * @param row       row
     * @param columnFamily 列族
     */
    public static void delete(String tableName, String row, String columnFamily) throws IOException {
        Table table = admin.getConnection().getTable(TableName.valueOf(tableName));
        Delete delete = new Delete(Bytes.toBytes(row));
        delete.addFamily(columnFamily.getBytes());
        table.delete(delete);
        table.close();
    }

    /**
     * 删除数据（根据row，列族）
     *
     * @param tableName    表名
     * @param row       row
     * @param columnFamily 列族
     * @param column       列
     */
    public static void delete(String tableName, String row, String columnFamily, String column) throws IOException {
        Table table = admin.getConnection().getTable(TableName.valueOf(tableName));
        Delete delete = new Delete(Bytes.toBytes(row));
        delete.addColumn(columnFamily.getBytes(), column.getBytes());
        table.delete(delete);
        table.close();
    }

    /**
     * 删除数据（多行）
     *
     * @param tableName 表名
     * @param rows   row集合
     */
    public static void delete(String tableName, List<String> rows) {
        deleteRows(tableName, rows.stream().map(Bytes::toBytes).collect(Collectors.toList()));
    }

    public static void deleteRows(String tableName, List<byte[]> rows) {
        try {
            try (Table table = admin.getConnection().getTable(TableName.valueOf(tableName))) {
                table.delete(rows.stream().map(Delete::new).collect(Collectors.toList()));
            }
        } catch (IOException e) {
            log.error(e.getMessage(), e);
        }
    }

    /**
     * 分区【10, 20, 30】 -> ( ,10] (10,20] (20,30] (30, )
     *
     * @param keys 分区集合[10, 20, 30]
     * @return byte二维数组
     */
    private static byte[][] getSplitKeys(List<String> keys) {
        byte[][] splitKeys = new byte[keys.size()][];
        TreeSet<byte[]> rows = new TreeSet<>(Bytes.BYTES_COMPARATOR);
        for (String key : keys) {
            rows.add(Bytes.toBytes(key));
        }
        int i = 0;
        for (byte[] row : rows) {
            splitKeys[i] = row;
            i++;
        }
        return splitKeys;
    }
}