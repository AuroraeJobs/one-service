package org.aurorae.tsdb.opentsdb;

import com.alibaba.fastjson.JSON;

import javax.annotation.Resource;
import java.util.List;
import java.util.function.Function;

public class TsdbQueryList<Query, Response> implements Function<Query, List<Response>> {

    private final Endpoint endpoint;
    private final Class<Response> responseClass;

    @Resource
    private TsdbClient<Query, Response> tsdbClient;

    public TsdbQueryList(Endpoint endpoint, Class<Response> responseClass) {
        this.endpoint = endpoint;
        this.responseClass = responseClass;
    }

    @Override
    public List<Response> apply(Query query) {
        return tsdbClient.request(endpoint, query, responseClass, JSON::parseArray);
    }
}
