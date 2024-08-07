package org.aurorae.flink.util;

import org.apache.flink.api.common.state.MapState;
import org.apache.flink.api.common.state.MapStateDescriptor;
import org.apache.flink.api.common.typeinfo.TypeHint;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.metrics.Counter;
import org.apache.flink.metrics.SimpleCounter;
import org.apache.flink.streaming.api.functions.ProcessFunction;
import org.apache.flink.util.Collector;

public class MapStateCounter<IN> extends ProcessFunction<IN, IN> {

    public String name;

    public final MapStateDescriptor<IN, Counter> descriptor;
    private final MapState<IN, Counter> counterMap;

    public MapStateCounter(String name) {
        this.name = name;
        this.descriptor = new MapStateDescriptor<>(
                name,
                TypeInformation.of(new TypeHint<IN>() {}),
                TypeInformation.of(new TypeHint<Counter>() {})
        );
        this.counterMap = getRuntimeContext().getMapState(descriptor);
    }

    public void inc(IN uk) throws Exception {
        if (!counterMap.contains(uk)) {
            SimpleCounter counter = new SimpleCounter();
            counterMap.put(uk, counter);
            getRuntimeContext().getMetricGroup().counter(String.format("%s-%s", name, uk), counter);
        }
        counterMap.get(uk).inc();
    }

    @Override
    public void processElement(IN value, ProcessFunction<IN, IN>.Context ctx, Collector<IN> out) throws Exception {
        out.collect(value);
    }
}
