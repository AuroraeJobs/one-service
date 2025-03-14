package org.aurorae.tsdb.opentsdb;

import java.util.Optional;

/**
 * @param <Query>    自定义请求体
 * @param <Response> 自定义结果集
 */
public abstract class TsdbQueryExpr<Query, Response> extends TsdbQuery<ExprQuery, ExprResponse> {

    public TsdbQueryExpr() {
        super(Endpoint.QUERY_EXP, ExprResponse.class);
    }

    /**
     * 将自定义请求体转化为tsdb请求体
     *
     * @param query 自定义请求体
     * @return tsdb请求体
     */
    public abstract ExprQuery convert(Query query);

    /**
     * 将tsdb结果集转化为自定义结果集
     *
     * @param response tsdb结果集
     * @return 自定义结果集
     */
    public abstract Response convert(ExprResponse response);

    public Response query(Query query) {
        return query(convert(query));
    }

    public Response query(ExprQuery query) {
        return Optional.ofNullable(apply(query))
                .map(this::convert)
                .orElse(null);
    }
}
