package org.aurorae.tsdb.api;

import org.aurorae.tsdb.opentsdb.MetricQueries;

public interface IMetricQueries {

    /**
     * 将自定义请求体转化为tsdb请求体
     *
     * @return tsdb请求体
     */
    MetricQueries convert();
}
