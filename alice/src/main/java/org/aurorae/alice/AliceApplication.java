package org.aurorae.alice;

import com.alibaba.dubbo.spring.boot.annotation.EnableDubboConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * @author aurorae
 */
@EnableDubboConfiguration
@SpringBootApplication
public class AliceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AliceApplication.class, args);
    }

}
