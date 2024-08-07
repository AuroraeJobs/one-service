package org.aurorae.blink.service.impl;

import org.apache.flink.streaming.api.datastream.DataStreamSource;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.aurorae.blink.service.BlinkService;

import java.util.List;

/**
 * @author aurorae
 */
public class BlinkServiceImpl implements BlinkService {

    public void wordCount(List<String> words) {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        DataStreamSource<String> source = env.fromCollection(words);
    }
}
