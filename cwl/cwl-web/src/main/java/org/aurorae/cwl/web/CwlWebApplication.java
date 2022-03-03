package org.aurorae.cwl.web;

import com.alibaba.dubbo.spring.boot.annotation.EnableDubboConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@EnableDubboConfiguration
@SpringBootApplication
public class CwlWebApplication {

    public static void main(String[] args) {
        SpringApplication.run(CwlWebApplication.class, args);
    }

}
