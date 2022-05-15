package org.aurorae.kafka.service;

import org.aurorae.kafka.service.impl.KafkaServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import javax.annotation.Resource;

@SpringBootTest
class KafkaServiceTest {

    @Resource
    private KafkaServiceImpl kafkaService;

    @Test
    void send() {
        kafkaService.send("001", "test");
    }
}
