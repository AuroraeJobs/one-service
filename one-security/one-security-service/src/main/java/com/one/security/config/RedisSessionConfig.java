package com.one.security.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;

@Configuration
@EnableRedisHttpSession(
    redisNamespace = "one:session",
    maxInactiveIntervalInSeconds = 7200
)
public class RedisSessionConfig {
}
