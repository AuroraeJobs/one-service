package org.aurorae.activemq.config;

import lombok.AllArgsConstructor;
import org.apache.activemq.ActiveMQConnectionFactory;
import org.apache.activemq.command.ActiveMQQueue;
import org.springframework.boot.autoconfigure.jms.activemq.ActiveMQProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jms.annotation.EnableJms;
import org.springframework.jms.config.JmsListenerContainerFactory;
import org.springframework.jms.config.SimpleJmsListenerContainerFactory;

import javax.jms.ConnectionFactory;
import javax.jms.Queue;

@Configuration
@EnableConfigurationProperties({ActiveMQProperties.class})
@EnableJms
@AllArgsConstructor
public class ActiveMQConfig {

    private final ActiveMQProperties properties;

    @Bean("queue")
    public Queue queue() {
        return new ActiveMQQueue("test");
    }

    @Bean
    public ConnectionFactory connectionFactory() {
        return new ActiveMQConnectionFactory(properties.getUser(), properties.getPassword(), properties.getBrokerUrl());
    }

    @Bean("queueListener")
    public JmsListenerContainerFactory<?> queueJmsListenerContainerFactory(ConnectionFactory connectionFactory) {
        SimpleJmsListenerContainerFactory containerFactory = new SimpleJmsListenerContainerFactory();
        containerFactory.setConnectionFactory(connectionFactory);
        containerFactory.setPubSubDomain(false);
        return containerFactory;
    }
}
