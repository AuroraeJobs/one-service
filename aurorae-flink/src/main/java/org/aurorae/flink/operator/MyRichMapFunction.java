package org.aurorae.flink.operator;

import org.apache.flink.api.common.functions.RichMapFunction;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;

public class MyRichMapFunction {

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        // 这里如果不设置2，并行度为CPU核数，本机为16
        env.setParallelism(2);

        DataStreamSource<Integer> source = env.fromElements(1, 2, 3, 4, 5, 7, 9, 11);
        source.map(new RichMapFunction<Integer, String>() {
            private String taskName = null;
            private int subTask;

            @Override
            public void open(Configuration parameters) throws Exception {
                super.open(parameters);
                taskName = getRuntimeContext().getTaskName();
                subTask = getRuntimeContext().getIndexOfThisSubtask();
                System.out.println(taskName + " - " + subTask + " open.");
            }

            @Override
            public String map(Integer value) throws Exception {
                return taskName + " - " + subTask + ": " + value;
            }

            @Override
            public void close() throws Exception {
                super.close();
                System.out.println(taskName + " - " + subTask + " close.");
            }
        }).print("my rich map: ");

        env.execute();
    }
}
