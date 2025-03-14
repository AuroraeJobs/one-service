package org.aurorae.tsdb.opentsdb;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.aurorae.common.util.MapUtil;
import org.aurorae.tsdb.api.*;
import org.aurorae.common.util.StringUtil;
import org.springframework.util.CollectionUtils;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TsdbQueryBuilder<MetricTags extends IMetricTags, Response extends IMetricPut>
        implements IMetricQueriesFunction<Response>, IMetricTagsList<MetricTags>, IMetricQueries {

    /**
     * 起始时间
     */
    public Object time;
    public Object start;
    public Object end;

    /**
     * 聚合条件、降采样
     */
    public Aggregator aggregator;
    public String downsample;

    /**
     * metric、tags
     */
    public String metric;
    public Map<String, Object> tags;

    public boolean delete;

    @Override
    public List<MetricTags> getQueries() {
        return null;
    }

    /**
     * 异步任务
     */
    public List<CompletableFuture<?>> futures = new ArrayList<>();

    public void waitAllDone() {
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
    }

    @Override
    public List<Response> apply(Function<MetricQueries, List<Response>> query) {
        if (CollectionUtils.isEmpty(getQueries())) {
            return null;
        }
        List<List<Response>> responses = Collections.synchronizedList(new ArrayList<>());
        getQueries().forEach(sub -> futures.add(CompletableFuture.runAsync(() ->
                query(build(sub.getMetric(), sub.getTags()), query, items -> {
                    items.forEach(item -> item.setMetric(sub.getMetric()));
                    responses.add(items);
                })
        )));
        waitAllDone();
        return responses
                .stream()
                .filter(Objects::nonNull)
                .flatMap(Collection::stream)
                .sorted(Comparator.comparing(Response::getTimestamp))
                .collect(Collectors.toList());
    }

    @Override
    public MetricQueries convert() {
        return build(this.metric, this.tags);
    }

    public MetricQueries build(String metric, Map<String, Object> tags) {
        // 设置聚合条件
        MetricQuery query = new MetricQuery().setAggregatorAndDownsample(this.aggregator, this.downsample);
        // 设置metric
        query.setMetric(metric);
        // 设置tags
        query.setTags(MapUtil.putValue(tags, this.tags));
        // 设置起始时间
        return byTime()
                .setDelete(this.delete)
                .addItem(query);
    }

    public MetricQueries byTime() {
        return Optional
                .ofNullable(this.time)
                .map(MetricQueries::new)
                .orElseGet(() -> new MetricQueries(this.start, this.end));
    }

    public void query(Consumer<ExprQuery> build, Function<ExprQuery, Response> query, Consumer<Response> response) {
        ExprQuery expr = expr();
        build.accept(expr);
        query(expr, query, response);
    }

    public void build(ExprQuery query, String metric, Map<String, Object> tags, String fid, String mid, String eid, String expr, String oid) {
        if (metric != null && !metric.isEmpty() && tags != null && !tags.isEmpty()) {
            query.addItem(Filter.builder()
                    .id(fid)
                    .tags(FilterTag.create(tags))
                    .build());
            if (StringUtil.isNotEmpty(mid)) {
                query.addItem(ExprQueryMetric.builder()
                        .id(mid)
                        .filter(fid)
                        .metric(metric)
                        .build());
            }
        }
        if (StringUtil.isNotEmpty(eid) && StringUtil.isNotEmpty(expr)) {
            query.addItem(ExprQueryExpression.create(eid, expr));
        }
        if (StringUtil.isNotEmpty(oid)) {
            query.addItem(ExprQueryOutput.builder()
                    .id(oid)
                    .build());
        }
    }

    public ExprQuery expr() {
        ExprQueryTime queryTime = Optional.ofNullable(this.time)
                .map(ExprQueryTime::new)
                .orElseGet(() -> new ExprQueryTime(this.start, this.end))
                .setAggregatorAndDownsample(this.aggregator, this.downsample);
        return new ExprQuery().setTime(queryTime);
    }

    public static <Query, Response> void query(Query request, Function<Query, Response> query, Consumer<Response> response) {
        Optional.ofNullable(query(request, query)).ifPresent(response);
    }

    public static <Query, Response> Response query(Query request, Function<Query, Response> query) {
        return query.apply(request);
    }
}
