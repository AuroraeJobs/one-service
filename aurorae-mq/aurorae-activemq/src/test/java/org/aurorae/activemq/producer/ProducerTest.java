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
        AlertEvent event = new AlertEvent();
        event.setDomains("/0/5415451345313/4321142432132/");
        producer.sendTopic(event);
    }
}