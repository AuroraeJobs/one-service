package org.aurorae.mq.service;

public interface KafkaService {
    void send(String topic, String data);
}
