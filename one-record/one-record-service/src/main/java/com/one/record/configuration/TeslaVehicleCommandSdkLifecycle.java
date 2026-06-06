package com.one.record.configuration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class TeslaVehicleCommandSdkLifecycle implements SmartLifecycle {

    private final TeslaFleetProperties properties;

    private volatile Process process;
    private volatile boolean running;

    @Override
    public void start() {
        if (!Boolean.TRUE.equals(properties.getCommandSdkEnabled())) {
            return;
        }
        if (running) {
            return;
        }
        validateRequired("tesla.fleet.command-sdk-binary", properties.getCommandSdkBinary());
        validateRequired("tesla.fleet.command-sdk-tls-cert", properties.getCommandSdkTlsCert());
        validateRequired("tesla.fleet.command-sdk-tls-key", properties.getCommandSdkTlsKey());
        validateRequired("tesla.fleet.command-sdk-private-key", properties.getCommandSdkPrivateKey());

        List<String> command = new ArrayList<>();
        command.add(properties.getCommandSdkBinary());
        command.add("-tls-key");
        command.add(properties.getCommandSdkTlsKey());
        command.add("-cert");
        command.add(properties.getCommandSdkTlsCert());
        command.add("-key-file");
        command.add(properties.getCommandSdkPrivateKey());
        command.add("-host");
        command.add(valueOrDefault(properties.getCommandSdkHost(), "127.0.0.1"));
        command.add("-port");
        command.add(String.valueOf(properties.getCommandSdkPort() == null ? 4443 : properties.getCommandSdkPort()));

        try {
            ProcessBuilder builder = new ProcessBuilder(command);
            builder.redirectErrorStream(true);
            Map<String, String> environment = builder.environment();
            if (hasText(properties.getCommandSdkCacheFile())) {
                environment.put("TESLA_CACHE_FILE", properties.getCommandSdkCacheFile().trim());
            }
            if (Boolean.TRUE.equals(properties.getCommandSdkVerbose())) {
                environment.put("TESLA_VERBOSE", "true");
            }
            process = builder.start();
            running = true;
            startLogReader(process);
            log.info("Tesla Vehicle Command SDK started on {}:{}",
                    valueOrDefault(properties.getCommandSdkHost(), "127.0.0.1"),
                    properties.getCommandSdkPort() == null ? 4443 : properties.getCommandSdkPort());
        } catch (Exception e) {
            running = false;
            throw new IllegalStateException("Tesla Vehicle Command SDK 启动失败: " + e.getMessage(), e);
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
        return Integer.MAX_VALUE - 100;
    }

    private void startLogReader(Process sdkProcess) {
        Thread thread = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(sdkProcess.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.info("[tesla-vehicle-command] {}", line);
                }
            } catch (Exception e) {
                log.debug("Tesla Vehicle Command SDK 日志读取结束: {}", e.getMessage());
            } finally {
                running = false;
            }
        }, "tesla-vehicle-command-sdk");
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
