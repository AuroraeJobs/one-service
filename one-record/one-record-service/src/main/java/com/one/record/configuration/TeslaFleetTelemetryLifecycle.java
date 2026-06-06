package com.one.record.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class TeslaFleetTelemetryLifecycle implements SmartLifecycle {

    private final TeslaFleetProperties properties;
    private final ObjectMapper objectMapper;

    private volatile Process process;
    private volatile boolean running;
    private volatile Path generatedConfigFile;

    @Override
    public void start() {
        if (!Boolean.TRUE.equals(properties.getTelemetryEnabled())) {
            return;
        }
        if (running) {
            return;
        }
        try {
            validateRequired("tesla.fleet.telemetry-binary", properties.getTelemetryBinary());
            String configFile = configFile();
            List<String> command = new ArrayList<>();
            command.add(properties.getTelemetryBinary());
            command.add("-config=" + configFile);
            ProcessBuilder builder = new ProcessBuilder(command);
            builder.redirectErrorStream(true);
            process = builder.start();
            running = true;
            startLogReader(process);
            log.info("Tesla Fleet Telemetry started with config {}", configFile);
        } catch (Exception e) {
            running = false;
            throw new IllegalStateException("Tesla Fleet Telemetry 启动失败: " + e.getMessage(), e);
        }
    }

    @Override
    public void stop() {
        Process current = process;
        if (current != null && current.isAlive()) {
            current.destroy();
            try {
                if (!current.waitFor(5, TimeUnit.SECONDS)) {
                    current.destroyForcibly();
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                current.destroyForcibly();
            }
        }
        running = false;
        process = null;
    }

    @Override
    public boolean isRunning() {
        Process current = process;
        return running && current != null && current.isAlive();
    }

    @Override
    public boolean isAutoStartup() {
        return true;
    }

    @Override
    public int getPhase() {
        return Integer.MAX_VALUE - 90;
    }

    private String configFile() throws Exception {
        if (hasText(properties.getTelemetryConfigFile())) {
            return properties.getTelemetryConfigFile().trim();
        }
        validateRequired("tesla.fleet.telemetry-tls-cert", properties.getTelemetryTlsCert());
        validateRequired("tesla.fleet.telemetry-tls-key", properties.getTelemetryTlsKey());

        Path file = Files.createTempFile("tesla-fleet-telemetry-", ".json");
        objectMapper.writeValue(file.toFile(), generatedConfig());
        generatedConfigFile = file;
        return file.toAbsolutePath().toString();
    }

    private Map<String, Object> generatedConfig() {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("host", valueOrDefault(properties.getTelemetryHost(), "0.0.0.0"));
        config.put("port", properties.getTelemetryPort() == null ? 443 : properties.getTelemetryPort());
        config.put("status_port", properties.getTelemetryStatusPort() == null ? 8080 : properties.getTelemetryStatusPort());
        config.put("log_level", valueOrDefault(properties.getTelemetryLogLevel(), "info"));
        config.put("json_log_enable", Boolean.TRUE.equals(properties.getTelemetryJsonLogEnabled()));
        config.put("namespace", valueOrDefault(properties.getTelemetryNamespace(), "tesla_telemetry"));
        config.put("reliable_ack", Boolean.TRUE.equals(properties.getTelemetryReliableAck()));
        config.put("transmit_decoded_records", Boolean.TRUE.equals(properties.getTelemetryTransmitDecodedRecords()));

        Map<String, Object> records = new LinkedHashMap<>();
        records.put("V", Collections.singletonList("redis"));
        records.put("connectivity", Collections.singletonList("redis"));
        records.put("alerts", Collections.singletonList("redis"));
        records.put("errors", Collections.singletonList("redis"));
        config.put("records", records);

        Map<String, Object> redis = new LinkedHashMap<>();
        redis.put("addrs", redisAddrs());
        redis.put("db", properties.getTelemetryRedisDb() == null ? 0 : properties.getTelemetryRedisDb());
        redis.put("publish_vin_topics", Boolean.TRUE.equals(properties.getTelemetryRedisPublishVinTopics()));
        if (hasText(properties.getTelemetryRedisUsername())) {
            redis.put("username", properties.getTelemetryRedisUsername().trim());
        }
        if (hasText(properties.getTelemetryRedisPassword())) {
            redis.put("password", properties.getTelemetryRedisPassword().trim());
        }
        if (hasText(properties.getTelemetryRedisSubscriberSetPrefix())) {
            redis.put("subscriber_set_prefix", properties.getTelemetryRedisSubscriberSetPrefix().trim());
        }
        config.put("redis", redis);

        Map<String, Object> tls = new HashMap<>();
        tls.put("server_cert", properties.getTelemetryTlsCert().trim());
        tls.put("server_key", properties.getTelemetryTlsKey().trim());
        if (hasText(properties.getTelemetryTlsCaFile())) {
            tls.put("ca_file", properties.getTelemetryTlsCaFile().trim());
        }
        config.put("tls", tls);
        return config;
    }

    private List<String> redisAddrs() {
        if (!hasText(properties.getTelemetryRedisAddrs())) {
            return Collections.singletonList("127.0.0.1:6379");
        }
        return Arrays.stream(properties.getTelemetryRedisAddrs().split(","))
                .map(String::trim)
                .filter(this::hasText)
                .collect(Collectors.toList());
    }

    private void startLogReader(Process telemetryProcess) {
        Thread thread = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(telemetryProcess.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.info("[tesla-fleet-telemetry] {}", line);
                }
            } catch (Exception e) {
                log.debug("Tesla Fleet Telemetry 日志读取结束: {}", e.getMessage());
            } finally {
                running = false;
            }
        }, "tesla-fleet-telemetry");
        thread.setDaemon(true);
        thread.start();
    }

    private void validateRequired(String name, String value) {
        if (!hasText(value)) {
            throw new IllegalStateException("缺少 " + name);
        }
    }

    private String valueOrDefault(String value, String defaultValue) {
        return hasText(value) ? value.trim() : defaultValue;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
