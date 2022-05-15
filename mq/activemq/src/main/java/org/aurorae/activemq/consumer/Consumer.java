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
}
