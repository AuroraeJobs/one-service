package org.aurorae.tsdb.hbase.config;

import org.aurorae.tsdb.hbase.util.HBaseClient;
import lombok.extern.slf4j.Slf4j;
import org.apache.hadoop.hbase.HBaseConfiguration;
import org.apache.hadoop.hbase.client.Admin;
import org.apache.hadoop.hbase.client.ConnectionFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.util.Optional;
import java.util.concurrent.Executors;

@Slf4j
@Configuration
@EnableConfigurationProperties(HBaseProperties.class)
@ConditionalOnProperty(value = "hbase.enable")
public class HBaseAutoConfiguration {

    @Bean
    public Admin admin(HBaseProperties properties) {
        return Optional.ofNullable(HBaseConfiguration.create())
                .map(configuration -> {
                    properties.getConfig().forEach(configuration::set);
                    try {
                        return ConnectionFactory.createConnection(configuration, Executors.newCachedThreadPool()).getAdmin();
                    } catch (IOException e) {
                        log.error(e.getMessage(), e);
                        throw new RuntimeException(e);
                    }
                })
                .orElse(null);
    }

    @Bean
    public HBaseClient client() {
        return new HBaseClient();
    }
}
