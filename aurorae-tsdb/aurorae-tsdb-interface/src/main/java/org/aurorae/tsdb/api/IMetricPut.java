package org.aurorae.tsdb.api;

import org.aurorae.tsdb.opentsdb.MetricPut;

public interface IMetricPut extends IMetricTags, IMetricValue {

    default MetricPut convert() {
        return MetricPut
                .builder()
                .metric(getMetric())
                .tags(getTags())
                .timestamp(getTimestamp())
                .value(getValue())
                .build();
    }
}
