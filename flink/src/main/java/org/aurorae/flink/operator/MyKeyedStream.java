package org.aurorae.flink.operator;

import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.SourceFunction;

import java.util.Objects;
import java.util.Random;

public class MyKeyedStream {

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        DataStreamSource<Integer> source = env.addSource(new SourceFunction<Integer>() {
            private boolean run = true;
            private final Random random = new Random();

            @Override
            public void run(SourceContext<Integer> ctx) throws Exception {
                while (run) {
                    int i = random.nextInt(10);
                    System.out.println("random:> " + i);
                    ctx.collect(i);
                    Thread.sleep(1000);
                }
            }

            @Override
            public void cancel() {
                run = false;
            }
        });
        /*
         * 逻辑分区与物理分区的区别
         * 算子与数据流的区别
         * keyBy is a logical partitioning, not a operator
         * see also: physical partitioning
         */
        source.keyBy(Objects::isNull)
                .reduce(Integer::sum)
                .print("reduce");

        env.execute();
    }
}
