package com.one.record.configuration;

import io.micrometer.observation.ObservationRegistry;
import org.springframework.ai.model.tool.ToolCallingManager;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenRouterChatModelConfig {

    @Bean
    @ConditionalOnMissingBean(name = "openRouterChatModel")
    public OpenAiChatModel openRouterChatModel(
            ToolCallingManager toolCallingManager,
            ObjectProvider<ObservationRegistry> observationRegistry,
            @Value("${spring.ai.openrouter.api-key}") String apiKey,
            @Value("${spring.ai.openrouter.base-url}") String baseUrl,
            @Value("${spring.ai.openrouter.chat.options.model}") String model,
            @Value("${spring.ai.openrouter.chat.options.temperature}") Double temperature,
            @Value("${spring.ai.openrouter.chat.options.max-tokens}") Integer maxTokens) {
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .apiKey(apiKey)
                .baseUrl(baseUrl)
                .model(model)
                .temperature(temperature)
                .maxTokens(maxTokens)
                .build();

        return OpenAiChatModel.builder()
                .options(options)
                .toolCallingManager(toolCallingManager)
                .observationRegistry(observationRegistry.getIfAvailable(() -> ObservationRegistry.NOOP))
                .build();
    }
}
