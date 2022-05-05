package org.aurorae.flink.source;

import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.aurorae.flink.util.KafkaUtil;

public class KafkaConnector {

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<String> source = env.addSource(KafkaUtil.addSource());
        source.print();
        env.execute();
    }
}
