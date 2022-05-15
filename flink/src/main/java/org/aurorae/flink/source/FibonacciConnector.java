package org.aurorae.flink.source;

import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.aurorae.flink.util.KafkaUtil;

public class FibonacciConnector {

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        env.getConfig().setAutoWatermarkInterval(100);
        env.addSource(new Fibonacci())
                .map(String::valueOf)
                .addSink(KafkaUtil.addSink());
        env.execute();
    }
}
