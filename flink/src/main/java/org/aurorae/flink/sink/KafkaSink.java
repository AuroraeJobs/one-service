package org.aurorae.flink.sink;

import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.aurorae.flink.util.KafkaUtil;

public class KafkaSink {

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);

        DataStreamSource<String> source = env.addSource(KafkaUtil.addSource());
        source.map(value -> value.split(" ")[0])
                .addSink(KafkaUtil.addSink());

        env.execute();
    }
}
