package org.aurorae.tsdb.hbase.service;

import lombok.extern.slf4j.Slf4j;
import org.aurorae.tsdb.api.IMetricPut;
import org.aurorae.tsdb.api.IMetricQueries;
import org.aurorae.tsdb.api.IMetricQueriesFunction;
import org.aurorae.tsdb.hbase.config.HBaseProperties;
import org.aurorae.tsdb.hbase.dao.HBaseCall;
import org.aurorae.tsdb.hbase.dao.HBaseRepository;
import org.aurorae.tsdb.opentsdb.MetricQueries;
import org.aurorae.tsdb.opentsdb.TsdbQueryMetric;
import org.springframework.boot.CommandLineRunner;

import javax.annotation.Resource;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Slf4j
public class HBaseService<Query extends IMetricQueries, Response> extends TsdbQueryMetric<Query, Response> implements IHBaseService<Query, Response>, CommandLineRunner {

    @Resource
    private HBaseProperties config;

    private HBaseRepository repository;

    @Override
    public void run(String... args) {
        if (connect()) {
            new Thread(() -> {
                try {
                    while (connect()) {
                        TimeUnit.MINUTES.sleep(5);
                    }
                } catch (Exception e) {
                    log.error(e.getMessage(), e);
                }
            }).start();
        }
    }

    private boolean connect() {
        try {
            this.repository = new HBaseRepository(config);
            return false;
        } catch (Exception e) {
            log.error("hbase connect error: {}", e.getMessage(), e);
            return true;
        }
    }

    public HBaseCall getCall(Supplier<String> metric) {
        return repository.getCall(metric.get());
    }

    @Override
    public void put(IMetricPut one) {
        Optional.ofNullable(getCall(one::getMetric)).ifPresent(call -> call.put(one));
    }

    @Override
    public List<Response> query(MetricQueries request) {
        return request.getQueries()
                .stream()
                .map(query -> Optional.ofNullable(getCall(query::getMetric))
                        .map(call -> call
                                .query(request.getStartTime(), request.getEndTime(), query.getTags()))
                        .orElse(null)
                )
                .filter(items -> items != null && !items.isEmpty())
                .map(this::convert)
                .filter(Objects::nonNull)
                .flatMap(Collection::stream)
                .collect(Collectors.toList());
    }

    @Override
    public <Request extends IMetricQueriesFunction<Response>> List<Response> request(Request request) {
        return super.apply(request);
    }

    @Override
    public void delete(MetricQueries request) {
        request.getQueries()
                .forEach(query -> Optional.ofNullable(getCall(query::getMetric))
                        .ifPresent(call -> call
                                .delete(request.getStartTime(), request.getEndTime(), query.getTags())));
    }
}
