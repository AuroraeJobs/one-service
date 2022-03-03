package org.aurorae.core;

import com.alibaba.dubbo.spring.boot.annotation.EnableDubboConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * @author aurorae
 */
@EnableDubboConfiguration
@SpringBootApplication
public class CoreWebApplication {

    public static void main(String[] args) {
        SpringApplication.run(CoreWebApplication.class, args);
    }

}
