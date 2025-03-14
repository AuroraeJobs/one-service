package org.aurorae.tsdb.hbase.service;

import org.aurorae.tsdb.api.IMetricPut;
import org.aurorae.tsdb.api.IMetricQueriesFunction;
import org.aurorae.tsdb.opentsdb.MetricQueries;

import java.util.List;

public interface IHBaseService<Query, Response> {

    void put(IMetricPut one);

    List<Response> query(MetricQueries query);

    <Request extends IMetricQueriesFunction<Response>> List<Response> request(Request request);

    List<Response> query(Query query);

    void delete(MetricQueries query);
}
