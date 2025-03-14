package org.aurorae.tsdb.opentsdb;

import org.aurorae.common.util.StringUtil;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Data
@Builder
@Accessors(chain = true)
@NoArgsConstructor
@AllArgsConstructor
public class MetricQuery {

    private String metric;
    private String downsample;
    private String aggregator;
    private Map<String, Object> tags;
    private List<FilterTag> filters;

    public static MetricQuery create(String metric, Map<String, Object> tags) {
        return MetricQuery.builder()
                .metric(metric)
                .tags(tags)
                .build();
    }

    public static MetricQuery create(String metric, String[][] filters) {
        return create(metric, FilterTag.create(filters));
    }

    public static MetricQuery create(String metric, List<FilterTag> filters) {
        return MetricQuery.builder()
                .metric(metric)
                .filters(filters)
                .build();
    }

    public MetricQuery setAggregatorAndDownsample(Aggregator aggregator, String downsample) {
        this.aggregator = Optional.ofNullable(aggregator).orElse(Aggregator.NONE).getName();
        if (StringUtil.isNotEmpty(downsample) && downsample.contains("-")) {
            this.downsample = downsample;
        }
        return this;
    }

    public MetricQuery addFilter(String tagk, Object filter) {
        if (StringUtil.isNotEmpty(filter)) {
            filters.add(FilterTag.create(tagk, filter));
        }
        return this;
    }
}
