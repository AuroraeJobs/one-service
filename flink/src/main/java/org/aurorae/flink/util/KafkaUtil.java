package org.aurorae.flink.util;

import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaProducer;

import java.util.Properties;

public class KafkaUtil {

    public static final String CLICKS_TOPIC = "clicks";
    public static final String OUTPUT_TOPIC = "clicks_output";
    public static final String BOOTSTRAP_SERVERS = "localhost:9092";

    public static Properties getProperties() {
        Properties properties = new Properties();
        properties.setProperty("bootstrap.servers", BOOTSTRAP_SERVERS);
        properties.setProperty("group.id", "consumer-group");
        properties.setProperty("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        properties.setProperty("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        properties.setProperty("auto.offset.reset", "latest");
        return properties;
    }

    public static FlinkKafkaConsumer<String> addSource() {
        return new FlinkKafkaConsumer<>(CLICKS_TOPIC, new SimpleStringSchema(), getProperties());
    }

    public static FlinkKafkaProducer<String> addSink() {
        return new FlinkKafkaProducer<>(BOOTSTRAP_SERVERS, OUTPUT_TOPIC, new SimpleStringSchema());
    }
}
