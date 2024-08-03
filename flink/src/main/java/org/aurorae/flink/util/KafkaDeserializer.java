package org.aurorae.flink.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.flink.api.common.serialization.AbstractDeserializationSchema;

import java.io.IOException;

@Slf4j
public class KafkaDeserializer<T> extends AbstractDeserializationSchema<T> {

    private JsonMapper<T> parser;
    private final Class<T> targetClass;

    public KafkaDeserializer(Class<T> targetClass) {
        super(targetClass);
        this.targetClass = targetClass;
    }

    @Override
    public void open(InitializationContext context) throws Exception {
        super.open(context);
        parser = new JsonMapper<>(targetClass);
    }

    @Override
    public T deserialize(byte[] message) throws IOException {
        try {
            return parser.fromByte(message);
        } catch (Exception e) {
            log.warn("Failed parsing, dropping it:", e);
        }
        return null;
    }
}
