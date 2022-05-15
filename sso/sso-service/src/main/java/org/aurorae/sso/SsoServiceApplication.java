package org.aurorae.sso;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.AdviceMode;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * @author aurorae
 */
@SpringBootApplication
@EnableTransactionManagement
@EnableCaching(mode = AdviceMode.ASPECTJ)
public class SsoServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SsoServiceApplication.class, args);
    }

}
