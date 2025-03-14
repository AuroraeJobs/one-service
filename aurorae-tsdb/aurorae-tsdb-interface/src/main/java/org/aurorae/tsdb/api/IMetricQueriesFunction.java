package org.aurorae.tsdb.api;

import org.aurorae.tsdb.opentsdb.MetricQueries;

import java.util.List;
import java.util.function.Function;

public interface IMetricQueriesFunction<Response> {

    List<Response> apply(Function<MetricQueries, List<Response>> query);
}
