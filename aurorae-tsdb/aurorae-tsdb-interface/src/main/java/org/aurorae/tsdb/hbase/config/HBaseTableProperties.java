package org.aurorae.tsdb.hbase.config;

import org.aurorae.tsdb.hbase.util.HBaseRowPeriod;
import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
public class HBaseTableProperties {

    /**
     * 表名
     */
    private String name;

    /**
     * 列名: 值的最大字节长度
     */
    private Map<String, Integer> columns = new HashMap<>();

    /**
     * 每行数据的存储周期
     */
    private HBaseRowPeriod period;

    /**
     * 数据是否压缩
     */
    private boolean compressed;
}
