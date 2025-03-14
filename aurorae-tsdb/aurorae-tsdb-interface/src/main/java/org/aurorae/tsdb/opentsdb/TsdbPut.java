package org.aurorae.tsdb.opentsdb;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import javax.annotation.Resource;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Component("tsdbPut")
public class TsdbPut<Put> implements Consumer<List<Put>> {

    private static final int PAGE_SIZE = 50;

    private final Endpoint endpoint;

    @Resource
    private TsdbClient<List<Put>, ?> tsdbClient;

    public TsdbPut() {
        this.endpoint = Endpoint.PUT;
    }

    @Override
    public void accept(List<Put> puts) {
        put(puts);
    }

    public void put(List<Put> puts) {
        if (!CollectionUtils.isEmpty(puts)) {
            int totalCount = puts.size();
            int pageSize = PAGE_SIZE;
            if (totalCount > pageSize) {
                Stream.iterate(0, i -> i + 1)
                        // 分批
                        .limit(Math.toIntExact(totalCount % pageSize == 0 ? (totalCount / pageSize) : (totalCount / pageSize + 1)))
                        .map(i -> puts.stream()
                                .skip(i * pageSize)
                                .limit(pageSize)
                                .collect(Collectors.toList()))
                        // 异步
                        .forEach(this::putAsync);
            } else {
                putAsync(puts);
            }
        }
    }

    public void putAsync(List<Put> puts) {
        CompletableFuture.runAsync(() -> tsdbClient.request(endpoint, puts));
    }

    public void put(Put put) {
        putAsync(Collections.singletonList(put));
    }
}
