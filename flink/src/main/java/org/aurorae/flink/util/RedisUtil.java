package org.aurorae.flink.util;

import org.apache.flink.streaming.connectors.redis.RedisSink;
import org.apache.flink.streaming.connectors.redis.common.config.FlinkJedisPoolConfig;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisCommand;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisCommandDescription;
import org.apache.flink.streaming.connectors.redis.common.mapper.RedisMapper;

public class RedisUtil {

    public static RedisSink<String> addSink() {
        FlinkJedisPoolConfig config = new FlinkJedisPoolConfig
                .Builder()
                .setHost("localhost")
                .build();
        return new RedisSink<>(config, new RedisMapper<String>() {
            @Override
            public RedisCommandDescription getCommandDescription() {
                return new RedisCommandDescription(RedisCommand.HSET, "flink");
            }

            @Override
            public String getKeyFromData(String s) {
                return s.split(":")[0];
            }

            @Override
            public String getValueFromData(String s) {
                return s.split(":")[1];
            }
        });
    }
}
