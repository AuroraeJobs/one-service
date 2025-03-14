package org.aurorae.tsdb.opentsdb;

import lombok.*;
import lombok.experimental.Accessors;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class MetricQueries extends TsdbTime {
    private List<MetricQuery> queries;
    private boolean msResolution;
    private boolean useCalendar;
    private String timezone;
    /**
     * 命中查询条件的数据点，是否删除
     * 注意，整小时的数据都会删除
     */
    private boolean delete;
    private boolean padding;
    private boolean showQuery;
    private boolean showStats;
    private boolean showTSUIDs;
    private boolean showSummary;
    private boolean noAnnotations;
    private boolean globalAnnotations;

    public MetricQueries(Object start, Object end) {
        super(start, end);
        this.msResolution = true;
        this.useCalendar = true;
        this.timezone = "Asia/Shanghai";
    }

    public MetricQueries(Object times) {
        super(times);
        this.msResolution = true;
        this.useCalendar = true;
        this.timezone = "Asia/Shanghai";
    }

    public MetricQueries addItem(MetricQuery item) {
        queries = addItem(queries, item);
        return this;
    }

    public <T> List<T> addItem(List<T> items, T item) {
        if (!CollectionUtils.isEmpty(items)) {
            items.add(item);
        } else {
            items = new ArrayList<>(Collections.singleton(item));
        }
        return items;
    }
}
