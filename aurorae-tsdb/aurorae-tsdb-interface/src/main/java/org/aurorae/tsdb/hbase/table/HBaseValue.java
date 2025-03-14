package org.aurorae.tsdb.hbase.table;

import com.alibaba.fastjson.JSON;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.hbase.util.Bytes;
import org.aurorae.tsdb.hbase.util.CompressionMeans;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Data
public class HBaseValue {

    public static final short DATATYPE_BOOLEAN = 0;
    public static final short DATATYPE_INTEGER = 1;
    public static final short DATATYPE_NUMBER = 2;
    public static final short DATATYPE_STRING = 3;
    public static final short DATATYPE_COMPRESSION = 4;
    public static final short DATATYPE_MAP = 10;

    public short dataType;
    public byte[] data;

    public HBaseValue(Object value, boolean compressed) {
        if (value instanceof Boolean) {
            Boolean v = (Boolean) value;
            this.data = Bytes.toBytes(v);
            this.dataType = DATATYPE_BOOLEAN;
        } else if (value instanceof Integer) {
            int v = (Integer) value;
            this.data = Bytes.toBytes(v);
            this.dataType = DATATYPE_INTEGER;
        } else if (value instanceof Number) {
            double doubleValue = ((Number) value).doubleValue();
            this.data = Bytes.toBytes(doubleValue);
            this.dataType = DATATYPE_NUMBER;
        } else if (value instanceof String) {
            String v = (String) value;
            if (compressed) {
                try {
                    byte[] bytes = Bytes.toBytes(v);
                    log.debug("> Before compression = {}", bytes.length);
                    this.data = CompressionMeans.compress(bytes, CompressionMeans.Level.BEST_SPEED);
                    log.debug("> After compression = {}", data.length);
                    this.dataType = DATATYPE_COMPRESSION;
                } catch (IOException e) {
                    log.error(e.getMessage(), e);
                }
            } else {
                this.data = Bytes.toBytes(v);
                this.dataType = DATATYPE_STRING;
            }
        } else if (value instanceof Map) {
            String v = JSON.toJSONString(value);
            this.data = Bytes.toBytes(v);
            this.dataType = DATATYPE_MAP;
        }
    }

    public static Object getValueByType(byte[] valueArray, short dataType) {
        switch (dataType) {
            case DATATYPE_BOOLEAN:
                return Bytes.toBoolean(valueArray);
            case DATATYPE_INTEGER:
                return Bytes.toInt(valueArray);
            case DATATYPE_NUMBER:
                return Bytes.toDouble(valueArray);
            case DATATYPE_STRING:
            case DATATYPE_MAP:
                return Bytes.toString(valueArray);
            case DATATYPE_COMPRESSION:
                try {
                    log.debug("> Before decompression = {}", valueArray.length);
                    byte[] decompress = CompressionMeans.decompress(valueArray);
                    log.debug("> After decompression = {}", decompress.length);
                    return Bytes.toString(decompress);
                } catch (Exception e) {
                    log.error(e.getMessage(), e);
                }
            default:
                return null;
        }
    }
}
