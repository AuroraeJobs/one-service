package org.aurorae.tsdb.opentsdb.service;

import org.aurorae.tsdb.api.IMetricPut;
import org.aurorae.tsdb.api.IMetricQueries;
import org.aurorae.tsdb.api.IMetricQueriesFunction;
import org.aurorae.tsdb.opentsdb.MetricPut;
import org.aurorae.tsdb.opentsdb.TsdbPut;
import org.aurorae.tsdb.opentsdb.TsdbQueryMetric;

import javax.annotation.Resource;
import java.util.List;

public class OpenTsdbService<Query extends IMetricQueries, Response> extends TsdbQueryMetric<Query, Response> implements IOpenTsdbService<Query, Response> {

    @Resource
    private TsdbPut<MetricPut> putService;

    @Override
    public void put(IMetricPut one) {
        putService.put(one.convert());
    }

    @Override
    public <Request extends IMetricQueriesFunction<Response>> List<Response> request(Request request) {
        return super.apply(request);
    }
}
