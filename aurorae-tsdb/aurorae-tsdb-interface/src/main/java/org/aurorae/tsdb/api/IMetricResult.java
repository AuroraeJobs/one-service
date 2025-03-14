package org.aurorae.tsdb.api;

import org.aurorae.tsdb.opentsdb.MetricDPs;

import java.util.List;
import java.util.function.Function;

public interface IMetricResult<Response> extends Function<MetricDPs, List<Response>> {
}
