package org.aurorae.flink.sink;

import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.aurorae.flink.util.KafkaUtil;
import org.aurorae.flink.util.RedisUtil;

public class RedisSink {

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);

        DataStreamSource<String> source = env.fromSource(KafkaUtil.addSource("test", String.class), WatermarkStrategy.noWatermarks(), "");
        source.addSink(RedisUtil.addSink());

        env.execute();
    }
}
