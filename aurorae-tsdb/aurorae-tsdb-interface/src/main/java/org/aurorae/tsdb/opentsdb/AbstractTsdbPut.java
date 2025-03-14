package org.aurorae.tsdb.opentsdb;

import javax.annotation.Resource;
import java.util.List;
import java.util.function.Consumer;
import java.util.stream.Collectors;

public abstract class AbstractTsdbPut<PutIn, Put> implements Consumer<List<PutIn>> {

    @Resource
    private TsdbPut<Put> tsdbClient;

    @Override
    public void accept(List<PutIn> puts) {
        put(puts);
    }

    /**
     * 将自定义请求体转化为tsdb请求体
     *
     * @param put 自定义请求体
     * @return tsdb请求体
     */
    public abstract Put convert(PutIn put);

    public void put(PutIn put) {
        tsdbClient.put(convert(put));
    }

    public void put(List<PutIn> put) {
        tsdbClient.put(put.stream().map(this::convert).collect(Collectors.toList()));
    }
}
