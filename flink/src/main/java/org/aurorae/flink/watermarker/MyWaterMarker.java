package org.aurorae.flink.watermarker;

import org.apache.flink.api.common.eventtime.SerializableTimestampAssigner;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.EventTimeSessionWindows;
import org.apache.flink.streaming.api.windowing.assigners.SlidingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.aurorae.flink.domain.MyData;

import java.time.Duration;

public class MyWaterMarker {

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);

        SingleOutputStreamOperator<MyData> operator = env.fromElements(MyData.myData())
                /*.assignTimestampsAndWatermarks(
                        WatermarkStrategy
                                .<MyData>forMonotonousTimestamps()
                                .withTimestampAssigner(new SerializableTimestampAssigner<MyData>() {
                                    @Override
                                    public long extractTimestamp(MyData element, long recordTimestamp) {
                                        return element.getTimestamp();
                                    }
                                })
                );*/
                .assignTimestampsAndWatermarks(
                        WatermarkStrategy
                                .<MyData>forBoundedOutOfOrderness(Duration.ofHours(1))
                                .withTimestampAssigner(new SerializableTimestampAssigner<MyData>() {
                                    @Override
                                    public long extractTimestamp(MyData element, long recordTimestamp) {
                                        return element.getTimestamp();
                                    }
                                })
                );
                operator.keyBy(MyData::getName)
                        //.countWindow(1)
                        //.window(EventTimeSessionWindows.withGap(Time.seconds(2)))
                        //.window(SlidingEventTimeWindows.of(Time.hours(1), Time.minutes(5)))
                        .window(TumblingEventTimeWindows.of(Time.hours(1)));

        env.execute();
    }
}
