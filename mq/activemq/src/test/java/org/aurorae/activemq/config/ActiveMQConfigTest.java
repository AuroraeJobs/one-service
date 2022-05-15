package org.aurorae.activemq.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jms.core.JmsMessagingTemplate;

import javax.jms.Queue;

@SpringBootTest
class ActiveMQConfigTest {

    @Autowired
    private JmsMessagingTemplate template;

    @Autowired
    private Queue queue;

    @Test
    void connectionFactory() {
        template.convertAndSend(queue, "hahaha");
    }
}