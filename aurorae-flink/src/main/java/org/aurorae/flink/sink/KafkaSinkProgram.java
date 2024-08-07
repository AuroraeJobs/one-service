package org.aurorae.flink.sink;

import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.aurorae.flink.util.KafkaUtil;

public class KafkaSinkProgram {

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);

        DataStreamSource<String> source = env.fromSource(KafkaUtil.addSource("test", String.class), WatermarkStrategy.noWatermarks(), "");
        source.map(value -> value.split(" ")[0])
                .sinkTo(KafkaUtil.addSink("test"));

        env.execute();
    }
}
