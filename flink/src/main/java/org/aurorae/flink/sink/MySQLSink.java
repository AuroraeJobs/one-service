package org.aurorae.flink.sink;

import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.aurorae.flink.util.JdbcUtil;

public class MySQLSink {

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);

        DataStreamSource<String> source = env.fromElements("flink:flink1.13", "mysql:mysql8.5");
        source.addSink(JdbcUtil.addSink());

        env.execute();
    }
}
