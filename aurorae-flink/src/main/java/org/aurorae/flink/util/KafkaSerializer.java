package org.aurorae.flink.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.flink.api.common.serialization.SerializationSchema;
import org.apache.flink.shaded.jackson2.com.fasterxml.jackson.core.JsonProcessingException;
import org.apache.flink.shaded.jackson2.com.fasterxml.jackson.databind.ObjectMapper;

@Slf4j
public class KafkaSerializer<T> implements SerializationSchema<T> {

    private ObjectMapper objectMapper;

    @Override
    public void open(InitializationContext context) throws Exception {
        SerializationSchema.super.open(context);
        objectMapper = new ObjectMapper();
    }

    @Override
    public byte[] serialize(T value) {
        try {
            return objectMapper.writeValueAsBytes(value);
        } catch (JsonProcessingException e) {
            log.error("serialize error", e);
        }
        return null;
    }
}
