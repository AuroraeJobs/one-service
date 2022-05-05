package org.aurorae.flink.operator;

import org.apache.flink.api.common.functions.Partitioner;
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.source.ParallelSourceFunction;
import org.apache.flink.streaming.api.functions.source.RichParallelSourceFunction;

public class MyPhysicalPartitioner {

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);

        DataStreamSource<Integer> source = env.fromElements(1, 2, 3, 4, 5, 7, 9, 11);
        // 物理分区的几种算法

        // 随机
        //source.shuffle().print().setParallelism(2);

        // 轮询
        //source.rebalance().print().setParallelism(2);

        // 缩放
        /*env.addSource(new RichParallelSourceFunction<Integer>() {
            @Override
            public void run(SourceContext<Integer> ctx) throws Exception {
                for (int i = 0; i < 10; i++) {
                    if (i % 2 == getRuntimeContext().getIndexOfThisSubtask()) {
                        ctx.collect(i);
                    }
                }
            }

            @Override
            public void cancel() {

            }
        }).setParallelism(2).rescale().print().setParallelism(4);*/

        // 广播
        //source.broadcast().print().setParallelism(2);

        // 全局
        //source.global().print().setParallelism(2);

        // 自定义
        //source.partitionCustom((Partitioner<Integer>) (key, numPartitions) -> key % 3, (KeySelector<Integer, Integer>) value -> value).print().setParallelism(4);
        source.partitionCustom((key, numPartitions) -> key % 2, value -> value).print().setParallelism(2);

        env.execute();
    }
}
