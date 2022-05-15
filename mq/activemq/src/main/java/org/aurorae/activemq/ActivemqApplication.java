package org.aurorae.activemq;

import com.alibaba.dubbo.spring.boot.annotation.EnableDubboConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableDubboConfiguration
public class ActivemqApplication {

	public static void main(String[] args) {
		SpringApplication.run(ActivemqApplication.class, args);
	}

}
