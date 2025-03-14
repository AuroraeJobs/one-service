package org.aurorae.tsdb.hbase.dao;

import org.aurorae.tsdb.hbase.table.HBaseTable;
import org.aurorae.tsdb.hbase.table.HBaseTagKey;
import org.aurorae.tsdb.hbase.util.HBaseClient;
import org.aurorae.tsdb.hbase.util.UidUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.hbase.util.Bytes;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
public final class HBaseId {

    private static final byte[] ID_FAMILY = Bytes.toBytes(HBaseTable.COLUMN_ID);
    private static final byte[] NAME_FAMILY = Bytes.toBytes(HBaseTable.COLUMN_NAME);
    private static final byte[] MAX_ID_ROW = {0};
    private final byte[] key;
    private final int width;
    private final Object newIdLock = new Object();
    private final Map<Object, Object> newIdMap = new HashMap<>();
    private final ConcurrentHashMap<Long, Object> idCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Object, byte[]> valueCache = new ConcurrentHashMap<>();

    public HBaseId(HBaseTagKey tag) {
        this(tag.getName(), tag.getWidth());
    }

    public HBaseId(final String key, final int width) {
        if (key == null || key.isEmpty()) {
            throw new IllegalArgumentException("Invalid key!");
        }
        if (width < 1 || width > 8) {
            throw new IllegalArgumentException("Invalid width: " + width);
        }
        this.key = Bytes.toBytes(key);
        this.width = width;
    }

    public byte[] getOrNewId(String table, Object value) {
        byte[] id = getId(table, value);
        if (id != null) {
            return id;
        }
        synchronized (newIdLock) {
            newIdMap.computeIfAbsent(value, k -> new Object());
        }
        synchronized (newIdMap.get(value)) {
            id = getId(table, value);
            if (id == null) {
                id = UidUtil.alignBytes(newId(table), width);
                byte[] valueBytes = Bytes.toBytes(value.toString());
                try {
                    HBaseClient.put(table, valueBytes, ID_FAMILY, key, id);
                    HBaseClient.put(table, id, NAME_FAMILY, key, valueBytes);
                } catch (IOException e) {
                    log.error(e.getMessage(), e);
                }
                cache(value, id);
            }
        }
        newIdMap.remove(value);
        return id;
    }

    public byte[] getId(String table, Object value) {
        try {
            byte[] cache = valueCache.get(value);
            if (cache != null) {
                return cache;
            }
            byte[] id = HBaseClient.get(table, Bytes.toBytes(value.toString()), ID_FAMILY, key);
            if (null == id) {
                return null;
            }
            cache(value, id);
            return id;
        } catch (IOException e) {
            log.error(e.getMessage(), e);
        }
        return null;
    }

    public Object getValue(String table, final byte[] id) {
        try {
            Object cache = idCache.get(Bytes.toLong(UidUtil.alignBytes(id)));
            if (cache != null) {
                return cache;
            }
            byte[] valueBytes = HBaseClient.get(table, id, NAME_FAMILY, key);
            if (valueBytes == null) {
                return empty(id) ? "" : null;
            }
            Object value = Bytes.toString(valueBytes);
            cache(value, id);
            return value;
        } catch (IOException e) {
            log.error(e.getMessage(), e);
        }
        return null;
    }

    private void cache(final Object value, final byte[] id) {
        cacheId(value, id);
        cacheValue(id, value);
    }

    private void cacheId(final Object value, final byte[] id) {
        byte[] exist = valueCache.get(value);
        if (exist == null) {
            exist = valueCache.putIfAbsent(value, Arrays.copyOf(id, id.length));
        }
        if (exist != null && !Arrays.equals(exist, id)) {
            throw new IllegalStateException("cacheId: value[" + value + "], id" + Arrays.toString(id) + ", exist: " + Arrays.toString(exist));
        }
    }

    private void cacheValue(byte[] id, final Object value) {
        id = UidUtil.alignBytes(id);
        long idLong = Bytes.toLong(id);
        Object exist = idCache.get(idLong);
        if (exist == null) {
            exist = idCache.putIfAbsent(idLong, value);
        }
        if (exist != null && !exist.equals(value) && !exist.toString().equals(value.toString())) {
            throw new IllegalStateException("cacheValue: value[" + value + "], id" + Arrays.toString(id) + ", exist: " + exist);
        }
    }

    public void clear() {
        idCache.clear();
        valueCache.clear();
    }

    private long newId(String table) {
        try {
            return HBaseClient.incrementValue(table, MAX_ID_ROW, ID_FAMILY, key);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            throw new RuntimeException(table + " new id error: " + e.getMessage());
        }
    }

    public static boolean empty(byte[] id) {
        boolean empty = true;
        for (byte b : id) {
            if (b != 0) {
                empty = false;
                break;
            }
        }
        return empty;
    }
}
