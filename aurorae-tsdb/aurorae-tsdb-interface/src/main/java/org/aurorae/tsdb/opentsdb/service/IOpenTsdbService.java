package org.aurorae.tsdb.opentsdb.service;

import org.aurorae.tsdb.api.IMetricPut;
import org.aurorae.tsdb.api.IMetricQueriesFunction;

import java.util.List;

public interface IOpenTsdbService<Query, Response> {

    void put(IMetricPut one);

    <Request extends IMetricQueriesFunction<Response>> List<Response> request(Request request);
}
