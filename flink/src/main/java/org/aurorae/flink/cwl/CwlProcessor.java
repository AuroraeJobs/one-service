package org.aurorae.flink.cwl;

import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.functions.ReduceFunction;
import org.apache.flink.api.common.typeinfo.TypeHint;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.aurorae.flink.util.KafkaUtil;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class CwlProcessor {

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);
        DataStreamSource<String> source = env.fromSource(KafkaUtil.addSource("cwl"), WatermarkStrategy.noWatermarks(), "cwl-source");
        source.print();
        SingleOutputStreamOperator<Integer> countStream = source.map(value -> Arrays.stream(value.split(",")).map(Integer::parseInt).collect(Collectors.toList()))
                .returns(TypeInformation.of(new TypeHint<List<Integer>>() {
                }))
                .process(new CwlCountFunction())
                .returns(Integer.class);
        countStream.print("sum ");
        // countStream.sinkTo(KafkaUtil.addSink("cwl-count"));
        countStream.countWindowAll(10).reduce(new ReduceFunction<Integer>() {
            @Override
            public Integer reduce(Integer value1, Integer value2) throws Exception {
                System.out.printf("(%s + %s)%n", value1, value2);
                return value1 + value2;
            }
        }).print("sum(10) ");
        env.execute();
    }
}
