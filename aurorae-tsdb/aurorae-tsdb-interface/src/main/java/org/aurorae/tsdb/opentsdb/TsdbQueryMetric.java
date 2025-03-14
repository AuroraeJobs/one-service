package org.aurorae.tsdb.opentsdb;

import org.aurorae.tsdb.api.IMetricQueries;
import org.aurorae.tsdb.api.IMetricQueriesFunction;

import java.util.List;
import java.util.Optional;
import java.util.function.Function;

/**
 * @param <Query>    自定义请求体
 * @param <Response> 自定义结果集
 */
public class TsdbQueryMetric<Query extends IMetricQueries, Response> extends TsdbQueryList<MetricQueries, MetricDPs> {

    public TsdbQueryMetric() {
        super(Endpoint.QUERY, MetricDPs.class);
    }

    /**
     * 将tsdb结果集转化为自定义结果集
     *
     * @param response tsdb结果集
     * @return 自定义结果集
     */
    public List<Response> convert(List<MetricDPs> response) {
        return MetricDPs.convert(response, convert());
    }

    public Function<MetricDPs, List<Response>> convert() {
        return null;
    }

    public List<Response> apply(IMetricQueriesFunction<Response> query) {
        return query.apply(this::query);
    }

    public List<Response> query(Query query) {
        return query(query.convert());
    }

    public List<Response> query(MetricQueries query) {
        return Optional.ofNullable(apply(query))
                .map(this::convert)
                .orElse(null);
    }
}
