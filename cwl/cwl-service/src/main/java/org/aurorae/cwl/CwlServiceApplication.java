package org.aurorae.cwl;

import com.alibaba.dubbo.spring.boot.annotation.EnableDubboConfiguration;
import org.aurorae.common.autoconfig.EnableHttpClient;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@EnableDubboConfiguration
@SpringBootApplication
@EnableHttpClient
public class CwlServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CwlServiceApplication.class, args);
    }

}
