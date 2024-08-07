package org.aurorae.flink.cwl;

import org.apache.flink.streaming.api.functions.ProcessFunction;
import org.apache.flink.util.Collector;
import org.aurorae.flink.util.MapStateCounter;

import java.util.List;

public class CwlCountFunction extends ProcessFunction<List<Integer>, Integer> {

    public final MapStateCounter<String> counter = new MapStateCounter<>("counterMapState");

    @Override
    public void processElement(List<Integer> value, ProcessFunction<List<Integer>, Integer>.Context ctx, Collector<Integer> out) throws Exception {
        value.forEach(integer -> {
            try {
                counter.inc(String.valueOf(integer));
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
        out.collect(value.stream().mapToInt(v -> v).sum());
    }
}
