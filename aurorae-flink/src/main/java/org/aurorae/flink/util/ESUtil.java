package org.aurorae.flink.util;

import org.apache.flink.api.common.functions.RuntimeContext;
import org.apache.flink.streaming.connectors.elasticsearch.ElasticsearchSinkFunction;
import org.apache.flink.streaming.connectors.elasticsearch.RequestIndexer;
import org.apache.flink.streaming.connectors.elasticsearch7.ElasticsearchSink;
import org.apache.http.HttpHost;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.client.Requests;

import java.util.ArrayList;
import java.util.List;

public class ESUtil {

    public static ElasticsearchSink<String> addSink() {
        List<HttpHost> httpHosts = new ArrayList<>();
        httpHosts.add(new HttpHost("localhost", 9200));
        httpHosts.add(new HttpHost("localhost", 9201));
        httpHosts.add(new HttpHost("localhost", 9202));
        return new ElasticsearchSink.Builder<>(httpHosts, new ElasticsearchSinkFunction<String>() {
            @Override
            public void process(String source, RuntimeContext runtimeContext, RequestIndexer requestIndexer) {
                String[] s = source.split(" ");
                IndexRequest request = Requests.indexRequest()
                        .index("flink")
                        .source(s[0], s[1], s[2], s[3]);
                requestIndexer.add(request);
            }
        }).build();
    }
}
