package org.aurorae.cwl;

import org.aurorae.common.autoconfig.EnableHttpClient;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableHttpClient
public class CwlServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CwlServiceApplication.class, args);
    }

}
