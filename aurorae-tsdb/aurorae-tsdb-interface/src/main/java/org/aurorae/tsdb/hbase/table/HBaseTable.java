package org.aurorae.tsdb.hbase.table;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.aurorae.tsdb.hbase.config.HBaseTableProperties;
import org.aurorae.tsdb.hbase.dao.HBaseId;
import org.aurorae.tsdb.hbase.dao.HBaseRowHelper;
import org.aurorae.tsdb.hbase.util.HBaseCell;
import org.aurorae.tsdb.hbase.util.HBaseRowPeriod;
import org.aurorae.tsdb.hbase.util.UidUtil;
import lombok.*;
import org.apache.hadoop.hbase.util.Bytes;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HBaseTable {

    public static final String TABLE_ADMIN = "admin-meta";
    public static final String TABLE_UID = "-uid";
    public static final String COLUMN_DATA = "d";
    public static final String COLUMN_ID = "id";
    public static final String COLUMN_NAME = "name";
    public static final byte[] COLUMN_FAMILY = {'t'};
    public static final byte[] COLUMN_DATA_BYTE = Bytes.toBytes(HBaseTable.COLUMN_DATA);

    public static final int PERIOD_WIDTH = 4;
    public static final int TIME_BIT = 8;

    private String tableName;

    private String uidTableName;

    private List<HBaseTagKey> tags;

    private HBaseRowPeriod period;

    private boolean compressed;

    private int rowLength;

    @JsonIgnore
    private Map<String, HBaseId> tagValueId;

    public static HBaseTable create(HBaseTableProperties properties) {
        return create(properties.getName(), HBaseTagKey.create(properties.getColumns()), properties.getPeriod(), properties.isCompressed());
    }

    public static HBaseTable create(String tableName, List<HBaseTagKey> tags, HBaseRowPeriod period, boolean compressed) {
        int rowLength = Optional.ofNullable(tags)
                .map(v -> v.stream().map(HBaseTagKey::getWidth).reduce(Integer::sum).orElse(0))
                .orElse(0) + HBaseTable.PERIOD_WIDTH;
        Map<String, HBaseId> tagValueId = Optional.ofNullable(tags)
                .map(v -> v.stream().collect(Collectors.toMap(HBaseTagKey::getName, HBaseId::new)))
                .orElse(new HashMap<>());
        return HBaseTable.builder()
                .tableName(tableName)
                .uidTableName(tableName + TABLE_UID)
                .tags(tags)
                .period(period)
                .compressed(compressed)
                .rowLength(rowLength)
                .tagValueId(tagValueId)
                .build();
    }

    public byte[] newRow(long timestamp, Map<String, Object> tags, boolean fill) {
        byte[] row = UidUtil.newBytes(this.rowLength, fill);
        int pos = 0;
        for (HBaseTagKey tagKey : this.tags) {
            String key = tagKey.getName();
            Object value = HBaseTable.getTagValue(key, tags);
            if (value != null) {
                byte[] bytes = getTagValueId(key).getOrNewId(this.uidTableName, value);
                HBaseCell.copyBytes(bytes, row, pos);
            }
            pos += tagKey.getWidth();
        }
        setRowTime(row, timestamp);
        return row;
    }

    public void setRowTime(byte[] row, long timestamp) {
        // 根据行周期设置行时间
        byte[] timeByte = HBaseRowHelper.msTimeToBytes(timestamp, this.period, HBaseTable.PERIOD_WIDTH);
        HBaseCell.copyBytes(timeByte, row, this.rowLength - HBaseTable.PERIOD_WIDTH);
    }

    public long getRowTime(byte[] row) {
        // 根据行周期获取行时间
        byte[] timeByte = HBaseCell.toBytes(row, this.rowLength - HBaseTable.PERIOD_WIDTH, HBaseTable.PERIOD_WIDTH, 8);// 小时数
        return HBaseRowHelper.timeBytesToMS(timeByte, this.period);
    }

    public HBaseId getTagValueId(String key) {
        return this.tagValueId.get(key);
    }

    public void clearTagUid() {
        this.tagValueId.values().forEach(HBaseId::clear);
    }

    public static Object getTagValue(String key, Map<String, Object> tags) {
        return Optional.ofNullable(tags).map(m -> m.get(key)).orElse(null);
    }
}
