package org.aurorae.cwl.service.impl;

import org.aurorae.cwl.service.CwlService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class CwlKafkaService implements CommandLineRunner {

    @Resource
    private KafkaTemplate<String, String> kafkaTemplate;

    @Resource
    private CwlService cwlService;

    @Override
    public void run(String... args) {
        cwlService.findByYear("2013")
                .forEach(cwl -> send("cwl", cwl.getRed().stream().map(String::valueOf).collect(Collectors.joining(","))));
    }

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
