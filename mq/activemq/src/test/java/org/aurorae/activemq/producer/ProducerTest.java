package org.aurorae.activemq.producer;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import javax.annotation.Resource;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ProducerTest {

    @Resource
    private Producer producer;

    @Test
    void sendMsg() {
        producer.sendMsg("hello");
    }

    @Test
    void sendTopic() {
        producer.sendTopic("hello");
    }
}