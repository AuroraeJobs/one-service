package org.aurorae.record.service.impl;

import lombok.AllArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;

//@Component
@AllArgsConstructor
public class RecordSender {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public void send(String topic, String data) {
        kafkaTemplate.send(topic, data);
    }
}
