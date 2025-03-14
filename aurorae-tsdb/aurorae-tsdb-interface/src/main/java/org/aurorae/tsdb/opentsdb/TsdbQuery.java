package org.aurorae.tsdb.opentsdb;

import com.alibaba.fastjson.JSON;

import javax.annotation.Resource;
import java.util.function.Function;

public class TsdbQuery<Query, Response> implements Function<Query, Response> {

    private final Endpoint endpoint;
    private final Class<Response> responseClass;

    @Resource
    private TsdbClient<Query, Response> tsdbClient;

    public TsdbQuery(Endpoint endpoint, Class<Response> responseClass) {
        this.endpoint = endpoint;
        this.responseClass = responseClass;
    }

    @Override
    public Response apply(Query query) {
        return tsdbClient.request(endpoint, query, responseClass, JSON::parseObject);
    }
}
