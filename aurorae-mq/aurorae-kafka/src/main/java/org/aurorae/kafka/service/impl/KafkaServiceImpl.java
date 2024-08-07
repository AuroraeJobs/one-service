package org.aurorae.kafka.service.impl;

import org.aurorae.mq.service.KafkaService;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Optional;

@Component
public class KafkaServiceImpl implements KafkaService {

    @Resource
    private KafkaTemplate<String, String> kafkaTemplate;

    @Override
    public void send(String topic, String data) {
        kafkaTemplate
                .send(topic, data)
                .addCallback(result -> {
                    assert result != null;
                    Optional.ofNullable(result.getRecordMetadata())
                            .ifPresent(metadata -> System.out.println(metadata.topic() + "'s offset is " + metadata.offset()));
                }, Throwable::printStackTrace);
    }
}
