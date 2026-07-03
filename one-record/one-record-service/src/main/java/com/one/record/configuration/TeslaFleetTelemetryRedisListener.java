package com.one.record.configuration;

import com.fasterxml.jackson.core.type.TypeReference;
import com.one.common.util.JsonUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.one.record.tesla.TeslaFleetTelemetryCache;
import org.springframework.context.SmartLifecycle;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class TeslaFleetTelemetryRedisListener implements SmartLifecycle, MessageListener {

    private static final String TELEMETRY_KEY_PREFIX = "tesla:fleet:telemetry:";

    private final TeslaFleetProperties properties;
    private final RedisConnectionFactory connectionFactory;
    private final StringRedisTemplate redisTemplate;

    private RedisMessageListenerContainer container;
    private volatile boolean running;

    @Override
    public void start() {
        if (!Boolean.TRUE.equals(properties.getTelemetryEnabled())) {
            return;
        }
        if (running) {
            return;
        }
        String namespace = namespace();
        RedisMessageListenerContainer listenerContainer = new RedisMessageListenerContainer();
        listenerContainer.setConnectionFactory(connectionFactory);
        listenerContainer.addMessageListener(this, new PatternTopic(namespace + "_V_*"));
        listenerContainer.addMessageListener(this, new PatternTopic(namespace + "_connectivity_*"));
        listenerContainer.addMessageListener(this, new PatternTopic(namespace + "_alerts_*"));
        listenerContainer.addMessageListener(this, new PatternTopic(namespace + "_errors_*"));
        listenerContainer.afterPropertiesSet();
        listenerContainer.start();
        container = listenerContainer;
        running = true;
        log.info("Tesla Fleet Telemetry Redis listener started for namespace {}", namespace);
    }

    @Override
    public void stop() {
        RedisMessageListenerContainer current = container;
        if (current != null) {
            current.stop();
            try {
                current.destroy();
            } catch (Exception e) {
                log.debug("Tesla Fleet Telemetry Redis listener 销毁结束: {}", e.getMessage());
            }
        }
        container = null;
        running = false;
    }

    @Override
    public boolean isRunning() {
        return running;
    }

    @Override
    public boolean isAutoStartup() {
        return true;
    }

    @Override
    public int getPhase() {
        return Integer.MAX_VALUE - 80;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String channel = new String(message.getChannel(), StandardCharsets.UTF_8);
        String payload = new String(message.getBody(), StandardCharsets.UTF_8);
        try {
            Map<String, Object> data = JsonUtil.toObject(payload, new TypeReference<Map<String, Object>>() {
            });
            String recordType = recordType(channel);
            String vin = vin(channel, data);
            if (!hasText(vin)) {
                log.debug("忽略缺少 VIN 的 Tesla 遥测消息: channel={}", channel);
                return;
            }
            TeslaFleetTelemetryCache cache = new TeslaFleetTelemetryCache();
            cache.setVin(vin);
            cache.setRecordType(recordType);
            cache.setChannel(channel);
            cache.setData(data);
            cache.setUpdatedAt(System.currentTimeMillis());
            redisTemplate.opsForValue().set(telemetryKey(vin, recordType), JsonUtil.toJson(cache));
        } catch (Exception e) {
            log.warn("Tesla 遥测消息保存失败: channel={}, error={}", channel, e.getMessage());
        }
    }

    private String recordType(String channel) {
        String prefix = namespace() + "_";
        if (!channel.startsWith(prefix)) {
            return "unknown";
        }
        String rest = channel.substring(prefix.length());
        int index = rest.indexOf('_');
        return index > 0 ? rest.substring(0, index) : rest;
    }

    private String vin(String channel, Map<String, Object> data) {
        Object vin = data.get("vin");
        if (vin == null) {
            vin = data.get("VIN");
        }
        if (vin == null) {
            vin = data.get("vehicle_id");
        }
        if (vin != null && hasText(String.valueOf(vin))) {
            return String.valueOf(vin).trim();
        }
        int start = channel.indexOf('{');
        int end = channel.indexOf('}', start + 1);
        if (start >= 0 && end > start) {
            return channel.substring(start + 1, end);
        }
        int last = channel.lastIndexOf('_');
        return last >= 0 && last + 1 < channel.length() ? channel.substring(last + 1) : "";
    }

    private String telemetryKey(String vin, String recordType) {
        return TELEMETRY_KEY_PREFIX + vin + ":" + recordType;
    }

    private String namespace() {
        return hasText(properties.getTelemetryNamespace()) ? properties.getTelemetryNamespace().trim() : "tesla_telemetry";
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
