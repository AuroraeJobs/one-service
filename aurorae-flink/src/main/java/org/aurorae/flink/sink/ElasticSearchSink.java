package org.aurorae.flink.sink;

import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.aurorae.flink.util.ESUtil;

public class ElasticSearchSink {

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);

        DataStreamSource<String> source = env.fromElements("username flink version 13", "username elasticsearch version 7.7");
        source.addSink(ESUtil.addSink());

        env.execute();
    }
}
