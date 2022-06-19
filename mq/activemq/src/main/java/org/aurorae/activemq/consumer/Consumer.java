package org.aurorae.activemq.consumer;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class Consumer {

    @JmsListener(destination = "test", containerFactory = "queueListener")
    public void receive(String message) {
        log.info("receive > " + message);
    }

    @JmsListener(destination = "topic", containerFactory = "topicListener")
    public void receiveTopic1(String text) {
        System.out.println("receiveTopic1接收到Topic消息 : " + text);
    }

    @JmsListener(destination = "topic", containerFactory = "topicListener")
    public void receiveTopic2(String text) {
        System.out.println("receiveTopic2接收到Topic消息 : " + text);
    }
}
