package org.aurorae.flink.table;

import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.table.api.Table;
import org.apache.flink.table.api.bridge.java.StreamTableEnvironment;
import org.aurorae.flink.domain.MyData;
import org.aurorae.flink.source.MySource;

import java.time.Duration;

import static org.apache.flink.table.api.Expressions.$;

public class MyTable {

  public static void main(String[] args) throws Exception {
    // env
    StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
    env.setParallelism(1);

    SingleOutputStreamOperator<MyData> operator =
        env.addSource(new MySource())
            .assignTimestampsAndWatermarks(
                WatermarkStrategy.<MyData>forBoundedOutOfOrderness(Duration.ZERO)
                    .withTimestampAssigner(
                        new SerializableTimestampAssigner<MyData>() {
                          @Override
                          public long extractTimestamp(MyData element, long recordTimestamp) {
                            return element.getTimestamp();
                          }
                        }));
    StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);
    Table table = tableEnv.fromDataStream(operator);
    Table query = tableEnv.sqlQuery("select name, url, 'timestamp' from " + table);
    Table result = table.select($("name"), $("url")).where($("name").isEqual("aurora"));
    tableEnv.toDataStream(query).print("query");
    tableEnv.toDataStream(result).print("result");

    env.execute();
  }
}
