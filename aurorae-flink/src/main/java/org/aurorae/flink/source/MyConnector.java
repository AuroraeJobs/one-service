package org.aurorae.flink.source;

import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.common.typeinfo.TypeHint;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.aurorae.flink.domain.MyData;

import java.sql.Timestamp;

public class MyConnector {

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.addSource(new MySource())
                .flatMap((FlatMapFunction<MyData, String>) (value, out) -> {
                    out.collect(value.getName());
                    out.collect(value.getUrl());
                    out.collect(new Timestamp(value.getTimestamp()).toString());
                })
                .returns(new TypeHint<String>() {})
                .print();
        env.execute();
    }
}
